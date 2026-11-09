import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Devices } from './entity/devices.js';
import { Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/create-device.dto.js';
import { UpdateDeviceDto } from './dto/update-device.dto.js';
import { DeviceStatus } from './enum/device-status.js';

@Injectable()
export class DeviceService {
    constructor(@InjectRepository(Devices) private deviceRepo: Repository<Devices>){}

    async enrollDevice(createDeviceDto: CreateDeviceDto): Promise<string>{
        try{
            const deviceInfo = await this.deviceRepo.create({
                ...createDeviceDto,
                workspace: {id: createDeviceDto.workspaceId}
            });

            const device = await this.deviceRepo.save(deviceInfo);
            
            if(device != null){
                return 'Device enrolled successfully';
            }
            else{
                return 'failed to enroll device';
            }
        }
        catch{
            throw new BadRequestException("Failed to add member");
        }
    }

    async getAllDevices(workspaceId: string): Promise<Devices[]>{
        return await this.deviceRepo.find({
            where:{
                workspace:{
                    id: parseInt(workspaceId)
                }
            }
        })
    }

    async getDeviceDetails(workspaceId: string, deviceId: string): Promise<Devices>{
        const data = await this.deviceRepo.findOne({
            where:{
                id: parseInt(deviceId),
                workspace:{
                    id: parseInt(workspaceId)
                }
            }
        })

        if (!data) {
            throw new NotFoundException('Device not found');
        }

        return data;
    }

    async updateDeviceInfo(workspaceId: string, deviceId: string, updateDeviceDto: UpdateDeviceDto): Promise<string>{
        const device = await this.getDeviceDetails(workspaceId, deviceId);
        if(device != null){
            const res = (await this.deviceRepo.update({ id: Number(deviceId) }, updateDeviceDto)).affected;
            if(res != null && res > 0){
                return 'updated successfully';
            }
            else{
                return 'Failed to update';
            }
        }
        else{
            throw new NotFoundException(`Device with id ${deviceId} not found`)
        }    
    }

    async getDeviceStatus(workspaceId: string, deviceId: string): Promise<DeviceStatus>{
        const data = await this.deviceRepo.findOne({
            where:{
                id: parseInt(deviceId),
                workspace:{
                    id: parseInt(workspaceId)
                }
            },
            select:{
                id: true,
                deviceStatus:true
            }
        })
        
        if (!data) {
            throw new NotFoundException('Device not found');
        }
        return data?.deviceStatus;
    }
}


