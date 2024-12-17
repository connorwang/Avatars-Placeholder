require('dotenv').config()
require('app-module-path').addPath(__dirname);

try {
    console.log('Starting server...');
    console.log('Environment:', process.env.MODE || 'development');
    console.log('Upload directory:', process.env.UPLOAD_DIR || './uploads');
    
    const App = require("./dist/app").default;
    new App();
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}