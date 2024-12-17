import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors';
import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'
import router from "./routes"

const app = express()

// Default cache TTL in seconds (1 hour)
const DEFAULT_CACHE_TTL = 31622400;

export default class Application{
    constructor(){
        console.log('Initializing Application...');
        this.verifyRequiredDirectories();
        this.config();
        this.setRoutes();
        this.configServer();
    }

    private verifyRequiredDirectories() {
        console.log('Verifying required directories...');
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        
        // Resolve absolute path
        const absoluteUploadDir = path.resolve(uploadDir);
        console.log('Upload directory (relative):', uploadDir);
        console.log('Upload directory (absolute):', absoluteUploadDir);
        console.log('Current working directory:', process.cwd());
        
        const requiredDirs = [
            absoluteUploadDir,
            path.join(absoluteUploadDir, 'id'),
            path.join(absoluteUploadDir, 'boy'),
            path.join(absoluteUploadDir, 'girl'),
            path.join(absoluteUploadDir, 'job')
        ];

        let allDirsExist = true;
        requiredDirs.forEach(dir => {
            try {
                const stats = fs.statSync(dir);
                if (stats.isDirectory()) {
                    console.log(`Directory verified: ${dir}`);
                    // List contents of directory
                    const files = fs.readdirSync(dir);
                    console.log(`Contents of ${dir}:`, files.length, 'files');
                } else {
                    console.error(`Path exists but is not a directory: ${dir}`);
                    allDirsExist = false;
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    console.error(`Error checking directory ${dir}:`, error.message);
                } else {
                    console.error(`Error checking directory ${dir}:`, error);
                }
                allDirsExist = false;
            }
        });

        if (!allDirsExist) {
            console.error('Some required directories are missing. Please ensure all directories exist and have proper permissions.');
            process.exit(1);
        }

        // Check for 404 avatar
        const avatar404Path = path.join(absoluteUploadDir, process.env.AVATAR_404 || '404.png');
        console.log('Checking 404 avatar at:', avatar404Path);
        try {
            const stats = fs.statSync(avatar404Path);
            if (stats.isFile()) {
                console.log('404 avatar found');
            } else {
                console.error('404 avatar path exists but is not a file');
                process.exit(1);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`Error checking 404 avatar: ${error.message}`);
            } else {
                console.error(`Error checking 404 avatar:`, error);
            }
            process.exit(1);
        }
    }

    configServer(){
        const port = process.env.PORT || 3000;
        console.log(`Starting server on port ${port}...`);
        
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            if (process.env.MODE === 'dev') {
                console.log("Development mode is enabled");
            }
        }).on('error', (err: Error) => {
            console.error('Server failed to start:', err);
        });
    }

    config(){
        console.log('Configuring middleware...');
        
        // CORS configuration
        const corsOptions = {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'HEAD'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            exposedHeaders: ['Content-Length'],
            credentials: true,
            maxAge: 86400 // 24 hours in seconds
        };
        app.use(cors(corsOptions));

        // Body parser middleware
        app.use(bodyParser.json())
        app.use(bodyParser.urlencoded({extended: true}))

        // Cache control middleware
        app.use((req: Request, res: Response, next: NextFunction) => {
            // Skip caching for development mode
            if (process.env.MODE === 'dev') {
                res.setHeader('Cache-Control', 'no-store');
            } else {
                const cacheTTL = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : DEFAULT_CACHE_TTL;
                res.setHeader('Cache-Control', `public, max-age=${cacheTTL}`);
            }
            next();
        });
    }

    setRoutes(){
        console.log('Setting up routes...');
        
        // Request logging middleware
        app.use((req: Request, res: Response, next: NextFunction) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
            next();
        });

        // Health check route
        app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                env: process.env.NODE_ENV || 'development',
                cache: {
                    ttl: process.env.CACHE_TTL || DEFAULT_CACHE_TTL,
                    enabled: process.env.MODE !== 'dev'
                }
            });
        });

        // Main routes
        app.use('/', router)
    }
    
}