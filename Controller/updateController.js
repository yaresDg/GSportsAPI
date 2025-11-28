import mongoose from 'mongoose';
import Update from '../model/updateModel.js';
import redisClient from '../redisClient.js';

const getUpdates=async (req,res)=>{
    try{
        const cacheKey='news_cache';
        try{
            const cachedData= await redisClient.get(cacheKey);
            if(cachedData){
                const newsResponse=JSON.parse(cachedData);
                return res.json(newsResponse);
            }
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        const news = await Update.find({},{__v: 0}).sort({fecha: -1}).lean();
        try{
            await redisClient.set(cacheKey, JSON.stringify(news), { EX: 3600 });
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(news);
    }
    catch (error) {
        console.error('Error en getUpdates:', error);
        return res.status(500).json({ error: 'Error al leer novedades' });
    }
}

const getUpdateById=async(req,res)=>{
    const newId=req.params.id;
    if (!mongoose.Types.ObjectId.isValid(newId)) return res.status(404).json({'message': 'not found'});
    try{
        const cacheKey=`new_${newId}`;
        try{
            const cachedData=await redisClient.get(cacheKey);
            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        const newResponse=await Update.findById(newId, {__v: 0}).lean();
        if(!newResponse){
            return res.status(404).json({'message': 'not found'});
        }
        try{
            await redisClient.set(cacheKey,JSON.stringify(newResponse),{EX: 3600});
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(newResponse);
    }
    catch(error){
        console.error('Error en getUpdateById:', error);
        return res.status(500).json({ error: 'Error al leer novedad' });
    }
}

const postUpdate=async (req,res)=>{
    const data= req.body;
    try{
        const newUpdate= new Update(data);
        await newUpdate.validate();
        const savedUpdate= await newUpdate.save();
        try{
            await redisClient.del('news_cache');
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.status(201).json(savedUpdate);
    }
    catch (error) {
        console.error('Error en postUpdate:', error);
        return res.status(500).json({ error: 'Error al postear novedad' });
    }
}

const putUpdate=async (req,res)=>{
    const newId=req.params.id;
    const data=req.body;
    if (!mongoose.Types.ObjectId.isValid(newId)) return res.status(404).json({'message': 'not found'});
    try{
        const updatedNew = await Update.findByIdAndUpdate(
            newId,
            data,
        { new: true, runValidators: true, projection: { __v: 0 } }).lean();
        if(!updatedNew) return res.status(404).json({'message': 'not found'});
        try{
            await redisClient.del('news_cache');
            await redisClient.del(`new_${newId}`);
            await redisClient.set(`new_${newId}`, JSON.stringify(updatedNew), { EX: 3600 });
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(updatedNew);
    }
    catch(error){
        console.error('Error en putUpdate:', error);
        return res.status(500).json({ error: 'Error al actualizar novedad' });
    }
}

const deleteUpdate=async (req,res)=>{
    const newId=req.params.id;
    if (!mongoose.Types.ObjectId.isValid(newId)) return res.status(404).json({'message': 'not found'});
    try{
        const deletedUpdate=await Update.findByIdAndDelete(newId, { projection: { __v: 0, createdAt: 0, updatedAt: 0 }}).lean();
        if(!deletedUpdate) return res.status(404).json({'message': 'not found'});
        try{
            await redisClient.del('news_cache');
            await redisClient.del(`new_${newId}`);
        }
        catch(redisError){
            console.warn('Error en Redis:', redisError);
        }
        return res.json(deletedUpdate);
    }
    catch(error){
        console.error('Error en deleteUpdate:', error);
        return res.status(500).json({ error: 'Error al eliminar novedad' });
    }
}

export default { getUpdates, getUpdateById, postUpdate, putUpdate, deleteUpdate}