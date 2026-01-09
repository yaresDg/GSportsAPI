import Visit from "../model/visitModel.js";
import { UAParser } from "ua-parser-js";

const getVisits=async(req,res)=>{
    try{
        const visits=await Visit.find({}, {__v: 0}).sort({ createdAt: -1 }).lean();
        return res.status(200).json(visits);
    }
    catch(error){
        console.error(error);
        return res.status(500).json({message:"Internal Server Error"});
    }
}

const postVisit=async(req, res)=>{
    try{
        const userAgent=req.headers['user-agent'] ||  "unknown";
        const parser=new UAParser(userAgent);
        const ua=parser.getResult();
        const browser = ua.browser?.name? ua.browser: { name: "unknown", version: "unknown" };
        const os = ua.os?.name? ua.os: { name: "unknown", version: "unknown" };
        const device=ua.device.type || "desktop"
        await Visit.create({
            ip: req.clientIp,
            browser,
            os,
            device,
            userAgent
        });
        return res.status(201).json({ success: true });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({message:"Internal Server Error"});
    }
}

export default { postVisit, getVisits };