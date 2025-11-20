import mongoose from 'mongoose';
import Radio from '../model/radioModel.js';
import redisClient from '../redisClient.js';

const getRadios=async (req,res)=>{
    try{
        const cacheKey='radios_cache';
        try{
            const cachedData= await redisClient.get(cacheKey);
            if(cachedData){
                const radiosResponse=JSON.parse(cachedData);
                return res.json(radiosResponse);
            }
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        const radios = await Radio.find({},{__v: 0}).lean();
        try{
            await redisClient.set(cacheKey, JSON.stringify(radios), { EX: 3600 });
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(radios);
    }
    catch (error) {
        console.error('Error en getRadios:', error);
        return res.status(500).json({ error: 'Error al leer radios' });
    }
}

const getRadioById=async(req,res)=>{
    const radioId=req.params.id;
    if (!mongoose.Types.ObjectId.isValid(radioId)) return res.status(404).json({'message': 'not found'});
    try{
        const cacheKey=`radio_${radioId}`;
        try{
            const cachedData=await redisClient.get(cacheKey);
            if (cachedData) {
                console.log(`Radio ${radioId} leído desde Redis`);
                return res.json(JSON.parse(cachedData));
            }
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        const radio=await Radio.findById(radioId, {__v: 0}).lean();
        if(!radio){
            return res.status(404).json({'message': 'not found'});
        }
        try{
            await redisClient.set(cacheKey,JSON.stringify(radio),{EX: 3600});
            console.log(`Radio ${radioId} guardado en Redis`);
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(radio);
    }
    catch(error){
        console.error('Error en getRadioById:', error);
        return res.status(500).json({ error: 'Error al leer radio' });
    }
}

const postRadio=async (req,res)=>{
    const data= req.body;
    try{
        const newRadio= new Radio(data);
        await newRadio.validate();
        const savedRadio= await newRadio.save();
        try{
            await redisClient.del('radios_cache');
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.status(201).json(savedRadio);
    }
    catch (error) {
        console.error('Error en postRadios:', error);
        return res.status(500).json({ error: 'Error al guardar la nueva radio' });
    }
}

const putRadio=async (req,res)=>{
    const radioId=req.params.id;
    const data=req.body;
    if (!mongoose.Types.ObjectId.isValid(radioId)) return res.status(404).json({'message': 'not found'});
    try{
        const updatedRadio = await Radio.findByIdAndUpdate(
            radioId,
            data,
        { new: true, runValidators: true, projection: { __v: 0 } }).lean();
        if(!updatedRadio) return res.status(404).json({'message': 'not found'});
        try{
            await redisClient.del('radios_cache');
            await redisClient.del(`radio_${radioId}`);
            await redisClient.set(`radio_${radioId}`, JSON.stringify(updatedRadio), { EX: 3600 });
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(updatedRadio);
    }
    catch(error){
        console.error('Error en putRadio:', error);
        return res.status(500).json({ error: 'Error al actualizar la radio' });
    }
}

const deleteRadio=async (req,res)=>{
    const radioId=req.params.id;
    if (!mongoose.Types.ObjectId.isValid(radioId)) return res.status(404).json({'message': 'not found'});
    try{
        const deletedRadio=await Radio.findByIdAndDelete(radioId, { projection: { __v: 0, createdAt: 0, updatedAt: 0 }}).lean();
        if(!deletedRadio) return res.status(404).json({'message': 'not found'});
        try{
            await redisClient.del('radios_cache');
            await redisClient.del(`radio_${radioId}`);
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(deletedRadio);
    }
    catch(error){
        console.error('Error en deleteRadio:', error);
        return res.status(500).json({ error: 'Error al eliminar la radio' });
    }
}

export default { getRadios, getRadioById, postRadio, putRadio, deleteRadio }