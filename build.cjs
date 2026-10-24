const fs=require('fs');
const esbuild=require('esbuild');
const result=esbuild.buildSync({entryPoints:['main.js'],bundle:true,write:false,minify:true,format:'iife',target:'es2020',legalComments:'inline',loader:{'.png':'dataurl'}});
const code=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const html=`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><meta name="theme-color" content="#172637"><meta name="description" content="月灯り · 雨夜便利店。离线三维微缩景观。"><title>月灯り · Rainy Night Konbini</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#182838}body{background:radial-gradient(ellipse at 49% 43%,#34485a 0%,#253748 44%,#142030 100%)}canvas{display:block;width:100%;height:100%;outline:none;touch-action:none;cursor:grab}canvas:active{cursor:grabbing}body:after{content:"";position:fixed;inset:0;pointer-events:none;box-shadow:inset 0 0 180px #08162666}</style></head><body><script>${code}</script></body></html>`;
fs.writeFileSync('rainy-night-konbini.html',html);
fs.writeFileSync('index.html',html);
console.log('Self-contained HTML:',Buffer.byteLength(html),'bytes');
