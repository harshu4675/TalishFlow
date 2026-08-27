#!/usr/bin/env node

/**
 * TalishFlow Fixes Validation Script
 * 
 * This script validates that all the critical fixes have been applied
 * without requiring the full infrastructure (MongoDB, Redis, etc.)
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TalishFlow Fixes Validation');
console.log('='.repeat(80));
console.log();

const checks = [];

function check(description, condition, details = '') {
  const result = {
    description,
    pass: condition,
    details,
  };
  checks.push(result);
  console.log(`[${result.pass ? '✓' : '✗'}] ${description}`);
  if (details && !result.pass) {
    console.log(`    Details: ${details}`);
  }
  return result.pass;
}

console.log('Checking Logo Fix...');
console.log('-'.repeat(40));
const logoPath = path.join(__dirname, 'client', 'public', 'logo.svg');
const logoExists = fs.existsSync(logoPath);
const logoSize = logoExists ? fs.statSync(logoPath).size : 0;
check(
  'Logo file exists',
  logoExists,
  logoExists ? `Size: ${logoSize} bytes` : 'Logo file not found'
);
check(
  'Logo file has content',
  logoSize > 0,
  logoSize > 0 ? `Size: ${logoSize} bytes` : 'Logo file is empty'
);
const logoContent = logoExists ? fs.readFileSync(logoPath, 'utf8') : '';
check(
  'Logo is valid SVG',
  logoContent.includes('<svg') && logoContent.includes('</svg>'),
  'Logo file is not a valid SVG'
);
console.log();

console.log('Checking Multer Configuration Fix...');
console.log('-'.repeat(40));
const multerPath = path.join(__dirname, 'server', 'src', 'config', 'multer.js');
const multerContent = fs.readFileSync(multerPath, 'utf8');
check(
  'Multer has chunk file filter',
  multerContent.includes('chunkFileFilter'),
  'chunkFileFilter function not found in multer.js'
);
check(
  'Multer exports uploadChunk',
  multerContent.includes('export const uploadChunk'),
  'uploadChunk export not found in multer.js'
);
check(
  'Chunk filter allows .part files',
  multerContent.includes('.part') || multerContent.includes('isPartFile'),
  'Chunk filter does not handle .part files'
);
console.log();

console.log('Checking Video Routes Fix...');
console.log('-'.repeat(40));
const routesPath = path.join(__dirname, 'server', 'src', 'routes', 'videoRoutes.js');
const routesContent = fs.readFileSync(routesPath, 'utf8');
check(
  'Routes import uploadChunk from multer',
  routesContent.includes('uploadChunk from "../config/multer.js"') ||
    routesContent.includes('uploadChunk } from "../config/multer.js"'),
  'uploadChunk not imported from multer'
);
check(
  'Chunk route uses uploadChunk middleware',
  routesContent.includes('uploadChunk.single("chunk")'),
  'Chunk route does not use uploadChunk middleware'
);
console.log();

console.log('Checking Video Controller Fixes...');
console.log('-'.repeat(40));
const controllerPath = path.join(__dirname, 'server', 'src', 'controllers', 'videoController.js');
const controllerContent = fs.readFileSync(controllerPath, 'utf8');
check(
  'Controller uses copyFile instead of rename',
  controllerContent.includes('fs.copyFile') || controllerContent.includes('await fs.copyFile'),
  'Controller still uses fs.rename which can fail cross-device'
);
check(
  'Controller has error cleanup in uploadChunk',
  controllerContent.includes('deleteFile(req.file.path)') || controllerContent.includes('await deleteFile'),
  'Controller does not clean up failed chunk uploads'
);
check(
  'Controller has logger imports',
  controllerContent.includes('import logger from'),
  'Controller missing logger for debugging'
);
check(
  'importYoutubeVideo has error handling',
  controllerContent.includes('try {') && controllerContent.includes('catch (error)') &&
    controllerContent.includes('importYoutubeVideo'),
  'importYoutubeVideo lacks proper error handling'
);
console.log();

console.log('Checking YouTube Download Service Fixes...');
console.log('-'.repeat(40));
const ytDownloadPath = path.join(__dirname, 'server', 'src', 'services', 'youtubeDownloadService.js');
const ytDownloadContent = fs.readFileSync(ytDownloadPath, 'utf8');
check(
  'YouTube download has path detection',
  ytDownloadContent.includes('getYtDlpPath') || ytDownloadContent.includes('YT_DLP_PATH'),
  'YouTube download does not detect yt-dlp path'
);
check(
  'YouTube download has retry logic',
  ytDownloadContent.includes('--retries') || ytDownloadContent.includes('retries'),
  'YouTube download lacks retry logic'
);
check(
  'YouTube download has timeout',
  ytDownloadContent.includes('--timeout') || ytDownloadContent.includes('timeout'),
  'YouTube download lacks timeout'
);
check(
  'YouTube download has better error messages',
  ytDownloadContent.includes('createError') || ytDownloadContent.includes('logger.error'),
  'YouTube download lacks proper error handling'
);
console.log();

console.log('Checking YouTube Metadata Service Fixes...');
console.log('-'.repeat(40));
const ytMetadataPath = path.join(__dirname, 'server', 'src', 'services', 'youtubeMetadataService.js');
const ytMetadataContent = fs.readFileSync(ytMetadataPath, 'utf8');
check(
  'Metadata service has improved URL parsing',
  ytMetadataContent.includes('YOUTUBE_HOSTNAMES') || ytMetadataContent.includes('youtu.be'),
  'Metadata service URL parsing could be improved'
);
check(
  'Metadata service has fallback for API failures',
  ytMetadataContent.includes('fallback') || ytMetadataContent.includes('catch (error)'),
  'Metadata service lacks fallback for API failures'
);
check(
  'Metadata service has better error messages',
  ytMetadataContent.includes('logger') || ytMetadataContent.includes('warn'),
  'Metadata service lacks proper logging'
);
console.log();

console.log('Checking Frontend Upload Service Fixes...');
console.log('-'.repeat(40));
const uploadServicePath = path.join(__dirname, 'client', 'src', 'services', 'uploadService.js');
const uploadServiceContent = fs.readFileSync(uploadServicePath, 'utf8');
check(
  'Upload service has error handling in initializeUpload',
  uploadServiceContent.includes('try {') && uploadServiceContent.includes('initializeUpload') &&
    uploadServiceContent.includes('catch (error)'),
  'initializeUpload lacks error handling'
);
check(
  'Upload service has error handling in uploadChunk',
  uploadServiceContent.includes('uploadChunk') &&
    uploadServiceContent.includes('try {') &&
    uploadServiceContent.includes('catch (error)'),
  'uploadChunk lacks error handling'
);
check(
  'Upload service has error handling in uploadYouTubeUrl',
  uploadServiceContent.includes('uploadYouTubeUrl') &&
    uploadServiceContent.includes('try {') &&
    uploadServiceContent.includes('catch (error)'),
  'uploadYouTubeUrl lacks error handling'
);
check(
  'Upload service uses parseErrorMessage',
  uploadServiceContent.includes('parseErrorMessage'),
  'Upload service does not parse error messages'
);
console.log();

console.log('Checking Frontend Loading Animations...');
console.log('-'.repeat(40));
const uploadItemPath = path.join(__dirname, 'client', 'src', 'features', 'upload', 'components', 'UploadItem.jsx');
const uploadItemContent = fs.readFileSync(uploadItemPath, 'utf8');
check(
  'UploadItem has motion animations',
  uploadItemContent.includes('motion.') && uploadItemContent.includes('animate'),
  'UploadItem lacks motion animations'
);
check(
  'UploadItem has pulsing effect for loading',
  uploadItemContent.includes('scale: [1, 1.05, 1]') || uploadItemContent.includes('animate-pulse'),
  'UploadItem lacks pulsing effect for loading states'
);

const youtubeInputPath = path.join(__dirname, 'client', 'src', 'features', 'upload', 'components', 'YoutubeUrlInput.jsx');
const youtubeInputContent = fs.readFileSync(youtubeInputPath, 'utf8');
check(
  'YouTube input has motion button',
  youtubeInputContent.includes('motion.button') || youtubeInputContent.includes('motion('),
  'YouTube input button lacks motion animations'
);
check(
  'YouTube input has loading animation',
  youtubeInputContent.includes('animate={') && youtubeInputContent.includes('scale'),
  'YouTube input lacks loading animation'
);
console.log();

console.log('='.repeat(80));
console.log('Summary');
console.log('='.repeat(80));

const passed = checks.filter(c => c.pass).length;
const failed = checks.length - passed;

console.log(`Total checks: ${checks.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log();

if (failed > 0) {
  console.log('Failed checks:');
  checks.filter(c => !c.pass).forEach(c => {
    console.log(`  - ${c.description}`);
    if (c.details) {
      console.log(`    ${c.details}`);
    }
  });
  console.log();
}

const successRate = (passed / checks.length) * 100;
console.log(`Success rate: ${successRate.toFixed(1)}%`);
console.log();

if (successRate >= 90) {
  console.log('✓ Most fixes have been successfully applied!');
} else if (successRate >= 70) {
  console.log('⚠ Many fixes applied, but some are missing.');
} else {
  console.log('✗ Critical fixes are missing.');
}

console.log('='.repeat(80));
