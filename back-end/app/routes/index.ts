import express, { Request, Response, NextFunction } from 'express';
import publicController from "../http/controller/publicController";
import Public from "./public";
import Username from "./username";
import Api from "./api";

const router = express.Router();

// Health check route
router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        uploadDir: process.env.UPLOAD_DIR || './uploads'
    });
});

//public
router.use('/public', Public);

//username
router.use('/username', Username);

//api
router.use('/api', Api);

//404
router.all('*', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).sendFile(publicController.get404Avatar(), { root: '.' });
});

export default router;
  