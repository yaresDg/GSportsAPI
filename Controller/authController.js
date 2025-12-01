import User from "../model/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config.js";


const postUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const usuarioExistente = await User.findOne({ username });
    if (usuarioExistente) return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    const nuevoUsuario = new User({
      username,
      password
    });
    await nuevoUsuario.save();
    return res.status(201).json({ message: 'Usuario creado exitosamente' });
  }
  catch (error) {
    console.log(`Error en postUser: ${error}`);
    return res.status(500).json({ message: 'error en el registro'});
  }
};

const postLogin=async(req,res)=>{
    const {username,password}=req.body;
    try{
        const usuario=await User.findOne({username});
        if(!usuario) return res.status(400).json({message:'username o password incorrectos'});
        const esValido = await bcrypt.compare(password, usuario.password);
        if(!esValido) return res.status(400).json({message:'username o password incorrectos'});
        const tokenResponse=jwt.sign({id:usuario._id},config.tokenSecret,{expiresIn:'1h'});
        return res.status(200).json({message:'login exitoso', token: tokenResponse});
    }
    catch(error){
        console.log(`Error en postLogin: ${error}`);
        return res.status(500).json({message:'error en el login'});
    }
}

export default { postUser, postLogin };