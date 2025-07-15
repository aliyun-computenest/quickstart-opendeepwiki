/**
 * esbuild 统一构建脚本
 * 支持普通构建和监视模式
 *
 * 使用方式:
 * - node widget-build.js          # 普通构建模式
 * - node widget-build.js --watch  # 监视模式
 */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import http from 'http';
import handler from 'serve-handler';

// 配置项
const PORT = 3366; // 服务器端口号

// 检查是否为监视模式
const isWatchMode = process.argv.includes('--watch');

// CSS 压缩函数
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
    .replace(/\s+/g, ' ')             // 合并空白字符
    .replace(/\s*({|}|,|:|;)\s*/g, '$1') // 移除选择器周围的空白
    .replace(/;}/g, '}')             // 移除最后的分号
    .trim();
}

// 创建CSS压缩插件
const cssMinifierPlugin = {
  name: 'css-minifier',
  setup(build) {
    // 只处理styles.ts文件
    build.onLoad({ filter: /styles\.ts$/ }, async (args) => {
      let contents = await fs.promises.readFile(args.path, 'utf8');

      // 查找模板字符串中的CSS
      const cssRegex = /const styles = `\s*\n([\s\S]*?)\s*`;/g;

      // 替换为压缩后的CSS
      contents = contents.replace(cssRegex, (match, cssContent) => {
        return 'const styles = `' + minifyCSS(cssContent) + '`;';
      });

      return {
        contents,
        loader: 'ts'
      };
    });
  }
};

// 构建配置
const buildOptions = {
  entryPoints: ['widget/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'browser',
  outfile: 'public/koala-chat-widget.js',
  plugins: [cssMinifierPlugin],
};

// 监视模式
async function watchBuild() {
  try {
    // 创建HTTP服务器
    const server = http.createServer((req, res) => {
      return handler(req, res, {
        public: './',
        cleanUrls: false
      });
    });

    // 启动服务器
    server.listen(PORT, () => {
      console.log(`✅ Http server started on port ${PORT}`);
    });

    const ctx = await esbuild.context({
      ...buildOptions,
      plugins: [
        ...buildOptions.plugins,
        {
          name: 'watch-plugin',
          setup(build) {
            // 是否已经显示链接
            let linkShown = false;

            build.onEnd(result => {
              if (result.errors.length > 0) {
                console.error('❌ Build failed:', result.errors);
              } else {
                const timestamp = new Date().toLocaleTimeString();
                console.log(`🔄 [${timestamp}] File change detected, rebuild successful`);

                // 首次构建成功后显示链接
                if (!linkShown) {
                  linkShown = true;
                  const sampleURL = `http://localhost:${PORT}/samples/widget.html`;
                  console.log('');
                  console.log('🔗 Widget sample available at:');
                  console.log(`\x1b[36m${sampleURL}\x1b[0m`);
                  console.log('');
                }
              }
            });
          },
        },
      ],
    });

    // 启动监视模式
    await ctx.watch();

    // 显示初始链接
    const sampleURL = `http://localhost:${PORT}/samples/widget.html`;
    console.log('👀 Watching widget files for changes...');
    console.log('✅ Initial build complete');
    console.log('');
    console.log('🔗 Widget sample available at:');
    console.log(`\x1b[36m${sampleURL}\x1b[0m`);
    console.log('');
    console.log('📝 Changes to files in widget/ directory will trigger automatic rebuild');
    console.log('💡 Press Ctrl+C to stop watching');

    // 保持进程运行
    await new Promise(() => {}); // 永不解决的 Promise
  } catch (error) {
    console.error('❌ Widget watch mode failed to start:', error);
    process.exit(1);
  }
}

// 单次构建
async function singleBuild() {
  try {
    await esbuild.build(buildOptions);
    console.log('✅ Widget build successful');
  } catch (error) {
    console.error('❌ Widget build failed:', error);
    process.exit(1);
  }
}

// 根据模式执行不同的构建函数
if (isWatchMode) {
  watchBuild();
} else {
  singleBuild();
}
