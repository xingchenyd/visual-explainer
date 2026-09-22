# 多算子模拟退火讲解视频

打开 exports/index.html 可观看视频并按章节跳转，或直接播放 exports/multi-operator-annealing.mp4。

采用旅行商问题，固定起点 A，欧氏对称距离；三种邻域操作固定等概率选择。seed=42，T0=8，每轮 T←0.99T，共600轮。原路线 58.07，历史最优 24.22，所有数值从 data/trace.json 读取并校验。

中文声音：本机 Microsoft Huihui Desktop 合成语音。字幕采用分场景字符比例估计时间，不声称逐字强制对齐。

此视频使用独立的 annealing-video-0.1 课程配置，不冒用矩阵 LessonIR 0.1。源脚本位于项目 scripts/annealing_video.py 和 scripts/narrate-annealing.ps1。
