# 发布到 GitHub Pages

此项目已包含 GitHub Pages 自动发布工作流。

1. 在 GitHub 创建一个公开仓库，例如 `nujiang-lisu-voice`。
2. 解压本项目压缩包，把全部文件上传到该仓库根目录。
3. 在仓库的 **Settings → Pages** 中，将发布来源设为 **GitHub Actions**。
4. 等待 **Actions** 中的 “Deploy GitHub Pages” 工作流完成，即可从其部署链接打开网站。

后续每次修改并推送到 `main` 分支，GitHub Pages 都会自动重新发布。

说明：这是静态网页版本。中文语音转文字需要浏览器支持；傈僳语录音、词条和反馈数据默认只保存在访问者自己的设备中。
