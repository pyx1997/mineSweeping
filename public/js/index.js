var socket=io('http://localhost:3000');


socket.on('allStart',data=>{
	console.log("data=",data)
	vm.$options.methods.checkStart(data)
})

socket.on('setTime',data=>{
	vm.$data.useTime=data.useTime;
	vm.$data.m_time=data.mTime;
})

// 接收服务器发送的地图坐标,实现所有用户雷的位置相同
socket.on('sendMap',data=>{
	vm.$data.gameMap=data;
	console.log("changeMap=",vm.$data.gameMap);
	
})

// 接收点击坐标
socket.on('sendSquare',data=>{
	var x=data.x;
	var y=data.y;
	vm.$options.methods.squareClick(x,y);
	
})

// 判断旗帜是否被选中
socket.on('flagState',data=>{
	vm.$data.flag=data;
})

var vm = new Vue({
	el:'#app',
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
		nowStunNum:10,
		stun:[],/*记录每个雷的位置*/
		// stuns:[
		// 	[0,1],[0,10],[2,8],[5,14],[6,3],[4,12],[8,4],[9,19],[7,16],[3,17]
		// ]
	},
	created() {
		/* 创建地图map*/
		this.createMap();
		this.ensureStun();
		this.mapValue();
		this.noStunNum=this.map_width*this.map_height-this.stun_num;
		socket.emit('mapValue',this.gameMap);
		socket.emit('init');
		socket.on('sendData',data=>{
			this.receiveData(data);
		})
	},
	// computed:{
	// 	noStunNum(){
	// 		return this.map_width*this.map_height-this.stun_num
	// 	}
	// },
	mounted(){
		var width=document.getElementById("tb").offsetWidth;
		document.getElementById("header").style.width=width+"px";
	},
	methods:{
		/* 重新开始游戏的按钮 */
		reset(){
			window.location.reload();
		},
		/* 扫描 （i，j） 这个点四周有多少地雷 */
		scan_arround(i, j){
			count = 0
			if(i - 1 >= 0 && this.gameMap[i-1][j] == -1) count++
			if(j - 1 >= 0 && this.gameMap[i][j-1] == -1) count ++
			if(i + 1 < this.map_height && this.gameMap[i+1][j] == -1) count ++
			if(j + 1 < this.map_width && this.gameMap[i][j+1] == -1) count ++
			if(j - 1 >= 0 && i - 1 >= 0 && this.gameMap[i - 1][j-1] == -1) count ++
			if(j + 1 < this.map_width && i + 1 < this.map_height && this.gameMap[i + 1][j + 1] == -1) count ++
			if(j - 1 >= 0 && i + 1 < this.map_height && this.gameMap[i + 1][j - 1] == -1) count ++
			if(j + 1 < this.map_width && i - 1 >= 0 && this.gameMap[i - 1][j + 1] == -1) count ++
			return count
		},
		
		start(){
			socket.emit('start',this.state)
		},
		
		// 清空定时器
		stop(){
			socket.emit('clearTime')
			// clearInterval(window.timeId);
			// window.timeId=0;
		},
		
		// 判断旗帜是否选中
		sign(){
			if(vm.$data.state==="再来一局") return
			socket.emit('checkFlag',!this.flag)
			
		},
		// 为地图赋值
		mapValue(){
			for(i = 0; i < this.map_height; i ++){
				for(j = 0; j < this.map_width; j ++){
					if(this.gameMap[i][j] != -1){
						this.gameMap[i][j] = this.scan_arround(i, j)
					}
				}
			}
		},
		/* 方块点击函数 */
		handle(i, j){
			
			socket.emit('square',{
				x:i,
				y:j
			})
			
			
		},
		
		// 地图中(i,j)的方块被点击
		squareClick(i,j){
			if(vm.$data.state==="开始" || vm.$data.state==="继续" || vm.$data.state==="再来一局"){
				return;
			}
			/* 获取点击的方块 */
			target = document.getElementById("tb").childNodes[i].childNodes[j];
			if(vm.$data.flag  && (target.innerHTML!=vm.$data.gameMap[i][j] ||target.innerHTML=="" )){
				socket.emit('flagClick',{
					x:i,
					y:j
				})
				if(vm.$data.gameMap_click[i][j]){
					vm.$data.gameMap_click[i][j]=false;
					vm.$data.nowStunNum++;
					target.className="unit";
					target.innerHTML="";
				}else{
					/* 设置该方块为已点击 */
					vm.$data.gameMap_click[i][j]=true;
					vm.$data.nowStunNum--;
					target.className='unit iconfont';
					target.innerHTML="&#xe732;";
				}
				socket.emit('sendStunNum',vm.$data.nowStunNum)
			}else{
				vm.$options.methods.auto_scan(i, j);
			}
			
		},
		/* 上下左右：1,2,3,4   0:四周 */
		auto_scan(i, j){
			if(i<0 || i >= vm.$data.map_height) return 
			if(j < 0 || j >= vm.$data.map_width ) return
			if(vm.$data.gameMap_click[i][j]) return
			if(vm.$data.fail || vm.$data.win) return;
			if(vm.$data.gameMap[i][j] == '-1'){
				target.style.backgroundColor="red"
				vm.$data.fail = true;
				socket.emit('again');
				vm.$data.state="再来一局";
				vm.$options.methods.stop();
				return;
			}
			socket.emit('squareClick',{
				x:i,
				y:j
			})
			target = document.getElementById("tb").childNodes[i].childNodes[j]
			/* 设置该方块为已点击 */
			vm.$data.gameMap_click[i][j]=true;
			target.innerHTML = vm.$data.gameMap[i][j];
			target.className="click";
			/* 分数加一 */
			vm.$data.score ++;
			socket.emit('sendScore',vm.$data.score)
			vm.$data.select_num++;
			if(vm.$data.select_num==vm.$data.noStunNum){
				vm.$data.win=true;
				socket.emit('again');
				vm.$data.state="再来一局";
				vm.$options.methods.stop();
				setTimeout(function(){
					alert("恭喜你赢了");
				},20);
				return;
			}
			
				
			/* 如果当前的方块数值不为0，则不进行扩散 */
			if(vm.$data.gameMap[i][j] != 0 ) return 
			/* 递归扩散 */
			vm.$options.methods.auto_scan(i + 1, j)
			vm.$options.methods.auto_scan(i - 1, j)
			vm.$options.methods.auto_scan(i, j + 1)
			vm.$options.methods.auto_scan(i, j - 1)
			vm.$options.methods.auto_scan(i + 1, j + 1)
			vm.$options.methods.auto_scan(i - 1, j + 1)
			vm.$options.methods.auto_scan(i + 1, j - 1)
			vm.$options.methods.auto_scan(i - 1, j - 1)
		},
		// 产生随机数
		getRandom(min,max){
			return Math.floor(Math.random()*(max-min))+min;
		},
		
		
		/* 创建地图map*/
		createMap(){
			for(i = 0; i < this.map_height; i ++){
				var tmp_list = []
				var tmp_list2 = []
				for(j = 0; j < this.map_width; j ++){
					tmp_list.push(0);
					tmp_list2.push(false)
				}
				this.gameMap.push(tmp_list)
				this.gameMap_click.push(tmp_list2)
			}
		},
		// 随机产生stun_num个雷
		ensureStun(){
			for(var i=0;i<this.stun_num;i++){
				var arr=[];
				var x=this.getRandom(0,this.map_height);
				var y=this.getRandom(0,this.map_width);
				arr.push(x);
				arr.push(y);
				var j=i;
				this.stun.forEach(function(a,b){
					if(arr[0]===a[0] && arr[1]==a[1]){
						i--; 
						return;
					}	
				})
				if(j==i){
					this.stun.push(arr);
					this.gameMap[x][y]=-1;
				}	
				
			}
		},
		
		// 给确定的坐标布雷
		// stunPos(stun){
		// 	stun.forEach(function(item,index){
		// 		var x=item[0];
		// 		var y=item[1];
		// 		console.log(x,y)
		// 		this.gameMap[x][y]=-1;
		// 	}.bind(this))
		// },
		
		
		// 判断游戏的状态
		checkStart(data){
			if(data=="开始" || data=="继续"){
				socket.emit('computedTime')
				// vm.$options.methods.computedTime();
				vm.$data.state="暂停"
			}else if(data=="暂停"){
				vm.$options.methods.stop();
				vm.$data.state="继续"
			}else{
				vm.$data.state="开始";
				vm.$data.flag=false;
				vm.$data.score=0;
				vm.$data.m_time=0;
				vm.$data.useTime="00:00:00";
				vm.$options.methods.reset()
			}
			socket.emit('sendState',vm.$data.state)
		},
		
		receiveData(data){
			vm.$data.useTime=data.time;
			vm.$data.m_time=data.timeS;
			vm.$data.flag=data.flag;
			vm.$data.state=data.state;
			vm.$data.score=data.score;
			if(vm.$data.state==="暂停"){
				socket.emit('computedTime')
			}
			if(data.flagPos.length!==0){
				data.flagPos.forEach(function(item){
					var x=item.x;
					var y=item.y;
					target = document.getElementById("tb").childNodes[x].childNodes[y];
					vm.$data.gameMap_click[x][y]=true;
					target.className='unit iconfont';
					target.innerHTML="&#xe732;";
					vm.$data.nowStunNum=data.nowStunNum;
				})
			}
			if(data.clickPos.length!==0){
				data.clickPos.forEach(function(item){
					var x=item.x;
					var y=item.y;
					target = document.getElementById("tb").childNodes[x].childNodes[y]
					/* 设置该方块为已点击 */
					vm.$data.gameMap_click[x][y]=true;
					target.innerHTML = vm.$data.gameMap[x][y]
					/* 设置该方块为红色 */
					target.className="click";
				})
			}
				
		}
		
	}
})
