// Comprehensive Features Demo - File uploads, cookies, static files, templates
import { createApp, httpMiddleware } from '@morojs/moro';
import path from 'path';

const app = createApp();

// Setup middleware
app.use(httpMiddleware.static({ 
  root: path.join(__dirname, '../public'),
  maxAge: 3600,
  etag: true 
}));

app.use(httpMiddleware.template({
  views: path.join(__dirname, '../views'),
  cache: process.env.NODE_ENV === 'production',
  defaultLayout: 'main'
}));

app.use(httpMiddleware.upload({
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'text/plain']
}));

// Cookie demo routes
app.get('/cookies/set', (req, res) => {
  res.cookie('username', 'john_doe', { 
    httpOnly: true, 
    maxAge: 86400000 // 24 hours
  })
  .cookie('theme', 'dark', { 
    maxAge: 86400000 
  })
  .json({ 
    success: true, 
    message: 'Cookies set successfully' 
  });
});

app.get('/cookies/get', (req, res) => {
  res.json({
    success: true,
    cookies: req.cookies || {},
    message: 'Retrieved all cookies'
  });
});

app.get('/cookies/clear', (req, res) => {
  res.clearCookie('username')
     .clearCookie('theme')
     .json({ 
       success: true, 
       message: 'Cookies cleared' 
     });
});

// File upload demo
app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No files uploaded'
    });
  }

  const uploadedFiles = Object.entries(req.files).map(([fieldName, file]: [string, any]) => ({
    field: fieldName,
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype
  }));

  res.json({
    success: true,
    message: 'Files uploaded successfully',
    files: uploadedFiles,
    formData: req.body.fields || {}
  });
});

// Template rendering demo
app.get('/template', async (req, res) => {
  await res.render('demo', {
    title: 'MoroJS Template Demo',
    message: 'Welcome to the comprehensive features demo!',
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    features: [
      { name: 'File Uploads', status: 'Complete' },
      { name: 'Cookie Support', status: 'Complete' },
      { name: 'Static Files', status: 'Complete' },
      { name: 'Template Rendering', status: 'Complete' }
    ],
    showAdvanced: true
  });
});

// Redirect demo
app.get('/redirect', (req, res) => {
  res.redirect('/template');
});

// File download demo
app.get('/download/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../downloads', filename);
  
  try {
    await res.sendFile(filePath);
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
});

// Combined features demo
app.post('/comprehensive', async (req, res) => {
  // Set a cookie
  res.cookie('lastAction', 'comprehensive-demo', { maxAge: 3600000 });
  
  // Handle file uploads
  const files = req.files ? Object.keys(req.files).length : 0;
  
  // Return comprehensive response
  res.json({
    success: true,
    message: 'Comprehensive demo executed',
    data: {
      cookies: req.cookies || {},
      filesUploaded: files,
      formData: req.body.fields || {},
      timestamp: new Date().toISOString()
    }
  });
});

const PORT = parseInt(process.env.PORT || '3005');
app.listen(PORT, undefined, () => {
  console.log(`Comprehensive Features Demo running on http://localhost:${PORT}`);
  console.log(`
Available endpoints:
  GET  /cookies/set     - Set demo cookies
  GET  /cookies/get     - Get all cookies
  GET  /cookies/clear   - Clear cookies
  POST /upload          - Upload files
  GET  /template        - Template rendering demo
  GET  /redirect        - Redirect demo
  GET  /download/:file  - File download demo
  POST /comprehensive   - Combined features demo
  GET  /*               - Static file serving
  `);
});

export default app; 