# 来源与假设

- [Rosati et al., 2022, Multi-neighborhood simulated annealing](https://link.springer.com/article/10.1007/s10951-022-00740-y)：多邻域组合与 Metropolis 接受机制。课程不是该论文算法的复现。
- [Cornell Optimization Wiki: Simulated annealing](https://optimization.cbe.cornell.edu/index.php?title=Simulated_annealing)：最小化问题的接受规则和降温。

城市坐标、初始路线、种子和参数均为教学构造。单位为抽象距离单位；温度与目标差值同尺度。固定 A 为起点；三种算子等概率，每轮对其余位置均匀抽样。插入采用 pop(i) 后 insert(j) 的位置定义。2-opt 反转包含端点的区段，适用于本例对称距离。没有自适应权重，没有多目标优化。有限预算不保证全局最优。
