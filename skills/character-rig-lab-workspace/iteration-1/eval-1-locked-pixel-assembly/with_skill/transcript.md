本轮为主代理执行可复用脚本的确定性验收，不是独立代理 A/B 对比。
init 对同一非空目录再次调用明确拒绝
verify 对真实 RGBA 层作 alpha 合成，pixelExact=true
verify 实际读取源文件计算 SHA-256，与锁定哈希相符
