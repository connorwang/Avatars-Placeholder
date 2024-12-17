"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const publicController_1 = __importDefault(require("../http/controller/publicController"));
const public_1 = __importDefault(require("./public"));
const username_1 = __importDefault(require("./username"));
const api_1 = __importDefault(require("./api"));
const router = express_1.default.Router();
// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        uploadDir: process.env.UPLOAD_DIR || './uploads'
    });
});
//public
router.use('/public', public_1.default);
//username
router.use('/username', username_1.default);
//api
router.use('/api', api_1.default);
//404
router.all('*', (req, res, next) => {
    res.status(200).sendFile(publicController_1.default.get404Avatar(), { root: '.' });
});
exports.default = router;
