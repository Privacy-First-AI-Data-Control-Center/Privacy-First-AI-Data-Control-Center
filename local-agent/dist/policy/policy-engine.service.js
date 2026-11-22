function asStringArray(value) {
    if (Array.isArray(value)) {
        return value.filter((v) => typeof v === 'string' && v.trim().length > 0);
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        return [value.trim()];
    }
    return [];
}
function matchesPattern(target, pattern) {
    if (!target || !pattern)
        return false;
    const trimmed = pattern.trim();
    // Regex literal format: /pattern/flags
    if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
        const lastSlash = trimmed.lastIndexOf('/');
        const body = trimmed.slice(1, lastSlash);
        const flags = trimmed.slice(lastSlash + 1) || 'i';
        try {
            return new RegExp(body, flags).test(target);
        }
        catch {
            // Fallback to substring match if invalid regex
        }
    }
    // Simple glob with * (e.g. "*.env", "*.pem")
    if (trimmed.includes('*')) {
        const escaped = trimmed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        try {
            return new RegExp(escaped, 'i').test(target);
        }
        catch {
            // Fallback to substring match
        }
    }
    return target.toLowerCase().includes(trimmed.toLowerCase());
}
function extractInspectableInputs(payload) {
    const input = payload.tool_input ?? {};
    const filePaths = [];
    const commands = [];
    const fileKeys = [
        'file_path',
        'filePath',
        'path',
        'Path',
        'TargetFile',
        'AbsolutePath',
        'target',
        'filename',
    ];
    for (const key of fileKeys) {
        const val = input[key];
        if (typeof val === 'string' && val.trim()) {
            filePaths.push(val.trim());
        }
    }
    const commandKeys = ['command', 'CommandLine', 'cmd', 'script'];
    for (const key of commandKeys) {
        const val = input[key];
        if (typeof val === 'string' && val.trim()) {
            commands.push(val.trim());
        }
    }
    let rawText = '';
    try {
        rawText = JSON.stringify(input);
    }
    catch {
        rawText = '';
    }
    return { filePaths, commands, rawText };
}
export class PolicyEngineService {
    policies = [];
    lastSyncedAt = null;
    backendClient;
    constructor(options = {}) {
        this.backendClient = options.backendClient;
    }
    getCachedPolicies() {
        return {
            lastSyncedAt: this.lastSyncedAt,
            total: this.policies.length,
            policies: this.policies,
        };
    }
    setPolicies(policies) {
        this.policies = [...policies].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        this.lastSyncedAt = new Date().toISOString();
    }
    async syncFromBackend() {
        if (!this.backendClient) {
            return { ok: false, total: this.policies.length, errorMessage: 'No backend client configured' };
        }
        const res = await this.backendClient.fetchActivePolicies();
        if (!res.ok || !res.data) {
            return {
                ok: false,
                total: this.policies.length,
                errorMessage: res.errorMessage ?? `HTTP ${res.statusCode}`,
            };
        }
        const rawPolicies = Array.isArray(res.data.policies)
            ? res.data.policies
            : [];
        this.setPolicies(rawPolicies);
        return {
            ok: true,
            total: this.policies.length,
            errorMessage: null,
        };
    }
    /**
     * Evaluates a PreToolUse hook payload against cached active policies in < 5ms.
     */
    evaluateHook(payload, connectorSlug) {
        // Only PreToolUse can intercept and block a tool call before execution
        if (payload.hook_event_name !== 'PreToolUse') {
            return {
                decision: 'ALLOW',
                policyId: null,
                policyVersionId: null,
                policyName: null,
                ruleId: null,
                reason: null,
                matchedValue: null,
            };
        }
        const { filePaths, commands, rawText } = extractInspectableInputs(payload);
        const toolName = (payload.tool_name ?? '').toLowerCase();
        let firstWarn = null;
        for (const policy of this.policies) {
            const sortedRules = [...(policy.rules ?? [])]
                .filter((r) => r.enabled !== false)
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            for (const rule of sortedRules) {
                const matchedValue = this.matchRule(rule, {
                    connectorSlug,
                    toolName,
                    filePaths,
                    commands,
                    rawText,
                });
                if (!matchedValue)
                    continue;
                const customReason = typeof rule.actionConfig?.reason === 'string' && rule.actionConfig.reason.trim()
                    ? rule.actionConfig.reason.trim()
                    : `Blocked by policy "${policy.name}" (matched "${matchedValue}")`;
                if (rule.effect === 'BLOCK' || rule.effect === 'REQUIRE_APPROVAL') {
                    return {
                        decision: 'BLOCK',
                        policyId: policy.id,
                        policyVersionId: policy.policyVersionId ?? null,
                        policyName: policy.name,
                        ruleId: rule.id,
                        reason: customReason,
                        matchedValue,
                    };
                }
                if (rule.effect === 'WARN' && !firstWarn) {
                    firstWarn = {
                        decision: 'WARN',
                        policyId: policy.id,
                        policyVersionId: policy.policyVersionId ?? null,
                        policyName: policy.name,
                        ruleId: rule.id,
                        reason: customReason,
                        matchedValue,
                    };
                }
            }
        }
        return (firstWarn ?? {
            decision: 'ALLOW',
            policyId: null,
            policyVersionId: null,
            policyName: null,
            ruleId: null,
            reason: null,
            matchedValue: null,
        });
    }
    matchRule(rule, ctx) {
        const cond = rule.condition ?? {};
        // Optional scope filter: connectors / integrations
        const connectors = [
            ...asStringArray(cond.connectors),
            ...asStringArray(cond.integrations),
            ...asStringArray(cond.connector),
        ];
        if (connectors.length > 0 &&
            !connectors.some((c) => c.toLowerCase() === ctx.connectorSlug.toLowerCase())) {
            return null;
        }
        // Optional scope filter: tool names
        const tools = [...asStringArray(cond.tools), ...asStringArray(cond.toolNames)];
        if (tools.length > 0 && !tools.some((t) => t.toLowerCase() === ctx.toolName)) {
            return null;
        }
        // 1. Check filePatterns against extracted filePaths and rawText
        const filePatterns = [
            ...asStringArray(cond.filePatterns),
            ...asStringArray(cond.filePattern),
            ...asStringArray(cond.blockedFiles),
            ...asStringArray(cond.paths),
        ];
        for (const pattern of filePatterns) {
            for (const fp of ctx.filePaths) {
                if (matchesPattern(fp, pattern))
                    return fp;
            }
            if (matchesPattern(ctx.rawText, pattern))
                return pattern;
        }
        // 2. Check commandPatterns against extracted commands and rawText
        const commandPatterns = [
            ...asStringArray(cond.commandPatterns),
            ...asStringArray(cond.commandPattern),
            ...asStringArray(cond.blockedCommands),
        ];
        for (const pattern of commandPatterns) {
            for (const cmd of ctx.commands) {
                if (matchesPattern(cmd, pattern))
                    return cmd;
            }
            if (matchesPattern(ctx.rawText, pattern))
                return pattern;
        }
        // 3. Generic pattern / regex / keywords
        const genericPatterns = [
            ...asStringArray(cond.pattern),
            ...asStringArray(cond.patterns),
            ...asStringArray(cond.regex),
            ...asStringArray(cond.keywords),
        ];
        for (const pattern of genericPatterns) {
            for (const fp of ctx.filePaths) {
                if (matchesPattern(fp, pattern))
                    return fp;
            }
            for (const cmd of ctx.commands) {
                if (matchesPattern(cmd, pattern))
                    return cmd;
            }
            if (matchesPattern(ctx.rawText, pattern))
                return pattern;
        }
        // 4. Pure tool or connector block (no file/command/generic patterns specified)
        if (filePatterns.length === 0 &&
            commandPatterns.length === 0 &&
            genericPatterns.length === 0 &&
            (tools.length > 0 || connectors.length > 0)) {
            return ctx.toolName || ctx.connectorSlug;
        }
        return null;
    }
}
//# sourceMappingURL=policy-engine.service.js.map