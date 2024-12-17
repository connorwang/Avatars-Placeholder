"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
// Default cache TTL in seconds (1 hour)
const DEFAULT_CACHE_TTL = 31622400;
class Application {
    constructor() {
        console.log('Initializing Application...');
        this.verifyRequiredDirectories();
        this.config();
        this.setRoutes();
        this.configServer();
    }
    verifyRequiredDirectories() {
        console.log('Verifying required directories...');
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        // Resolve absolute path
        const absoluteUploadDir = path_1.default.resolve(uploadDir);
        console.log('Upload directory (relative):', uploadDir);
        console.log('Upload directory (absolute):', absoluteUploadDir);
        console.log('Current working directory:', process.cwd());
        const requiredDirs = [
            absoluteUploadDir,
            path_1.default.join(absoluteUploadDir, 'id'),
            path_1.default.join(absoluteUploadDir, 'boy'),
            path_1.default.join(absoluteUploadDir, 'girl'),
            path_1.default.join(absoluteUploadDir, 'job')
        ];
        let allDirsExist = true;
        requiredDirs.forEach(dir => {
            try {
                const stats = fs_1.default.statSync(dir);
                if (stats.isDirectory()) {
                    console.log(`Directory verified: ${dir}`);
                    // List contents of directory
                    const files = fs_1.default.readdirSync(dir);
                    console.log(`Contents of ${dir}:`, files.length, 'files');
                }
                else {
                    console.error(`Path exists but is not a directory: ${dir}`);
                    allDirsExist = false;
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error(`Error checking directory ${dir}:`, error.message);
                }
                else {
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
        const avatar404Path = path_1.default.join(absoluteUploadDir, process.env.AVATAR_404 || '404.png');
        console.log('Checking 404 avatar at:', avatar404Path);
        try {
            const stats = fs_1.default.statSync(avatar404Path);
            if (stats.isFile()) {
                console.log('404 avatar found');
            }
            else {
                console.error('404 avatar path exists but is not a file');
                process.exit(1);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`Error checking 404 avatar: ${error.message}`);
            }
            else {
                console.error(`Error checking 404 avatar:`, error);
            }
            process.exit(1);
        }
    }
    configServer() {
        const port = process.env.PORT || 3000;
        console.log(`Starting server on port ${port}...`);
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            if (process.env.MODE === 'dev') {
                console.log("Development mode is enabled");
            }
        }).on('error', (err) => {
            console.error('Server failed to start:', err);
        });
    }
    config() {
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
        app.use((0, cors_1.default)(corsOptions));
        // Body parser middleware
        app.use(body_parser_1.default.json());
        app.use(body_parser_1.default.urlencoded({ extended: true }));
        // Cache control middleware
        app.use((req, res, next) => {
            // Skip caching for development mode
            if (process.env.MODE === 'dev') {
                res.setHeader('Cache-Control', 'no-store');
            }
            else {
                const cacheTTL = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : DEFAULT_CACHE_TTL;
                res.setHeader('Cache-Control', `public, max-age=${cacheTTL}`);
            }
            next();
        });
    }
    setRoutes() {
        console.log('Setting up routes...');
        // Request logging middleware
        app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
            next();
        });
        // Health check route
        app.get('/health', (req, res) => {
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
        app.use('/', routes_1.default);
    }
}
exports.default = Application;
