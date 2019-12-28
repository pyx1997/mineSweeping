# 扫雷游戏项目介绍

该项目是一个小型扫雷游戏，利用socket.io技术，多人可同时同屏扫雷，雷的位置每次随机生成，雷的数目和画布总格子数可根据自己需求在代码中修改（index.js）

```
data:{
		map_width:20, /* 地图宽*/
		map_height:10,/* 地图高 */
		gameMap:[], /* 地图 ，数值为 -1 表示该处有雷*/
		gameMap_click:[], /* 地图点击的记录 */
		fail:false,/* 游戏输了 */
		win:false,/* 游戏赢了 */
		score:0, /* 分数*/
		m_time:0, /* 计时(秒数)*/
		useTime:"00:00:00",/* 最终显示在页面上的计时*/
		state:"开始",/* 按钮的文本*/
		flag:false,/* 是否为插旗状态*/
		stun_num:10,/*雷的数量*/
		select_num:0,/*当前翻过的格子数*/
		noStunNum:0,
		nowStunNum:0,/*存储当前剩余雷的数量*/
		stun:[],/*记录每个雷的位置*/
	},
```

运行项目：打开目录所在命令行，输入 node socket.js ，然后在浏览器打开localhost:3000即可





