var app=require('express')();
var server=require('http').Server(app);
var io=require('socket.io')(server);
let gameMap=[];
let flag=false;
let score=0;
let time="00:00:00";
let timeS=0;
let state="开始";
let clickPos=[];
let flagPos=[];
let win=false;
let fail=false;
let nowStunNum=0;
let checkTime=false;
let timeId;
let count=0;
server.listen(3000,()=>{
	console.log("服务器启动成功了")
});

app.use(require('express').static('public'))
app.get('/',function(req,res){
	res.redirect('/index.html');
})
io.on('connection',function(socket){
	count++;
	console.log("新用户连接了")
	socket.on('computedTime',data=>{
		if(checkTime) return;
		checkTime=true;
		timeId=setInterval(function () {
			timeS++;
			var h=parseInt(timeS/60/60);
			if(h<10){h="0"+h}
			var m=parseInt(timeS/60)%60;
			if(m<10){m="0"+m}
			var s=timeS%60;
			if(s<10){s="0"+s}
			time=h+":"+m+":"+s;
			io.emit('setTime',{
				useTime:time,
				mTime:timeS,
			})
		}, 1000);
	})
	socket.on('sendStunNum',data=>{
		nowStunNum=data;
	})
	socket.on('clearTime',data=>{
		clearInterval(timeId);
		checkTime=false;
	})
	socket.on('start',data=>{
		io.emit('allStart',data)
	})
	socket.on('mapValue',data=>{
		if(gameMap.length==0){
			gameMap=data;
		}
		
		io.emit('sendMap',gameMap)
	})
	socket.on("square",data=>{
		io.emit("sendSquare",data);
		
	})
	socket.on('squareClick',data=>{
		clickPos.push(data);
	})
	socket.on('checkFlag',data=>{
		flag=data;
		io.emit('flagState',data)
	})
	socket.on('sendScore',data=>{
		score=data;
	})
	socket.on('sendState',data=>{
		state=data;
	})
	socket.on('flagClick',data=>{
		if(flagPos.length===0){
			flagPos.push(data);
		}else{
			flagPos.forEach(function(item,index){
				if(item.x===data.x && item.y===data.y){
					flagPos.splice(index,1);
					return;
				}
			})
			flagPos.push(data);
		}
	})
	socket.on('again',data=>{
		gameMap=[];
		clickPos=[];
		flagPos=[];
		state="开始";
		flag=false;
		score=0;
		time="00:00:00";
		timeS=0;
	})
	socket.on('init',data=>{
		socket.emit('sendData',{
			flag:flag,
			time:time,
			score:score,
			state:state,
			clickPos:clickPos,
			timeS:timeS,
			clickPos:clickPos,
			flagPos:flagPos,
			nowStunNum:nowStunNum,
			count:count
		})
		console.log("click=",clickPos);
		console.log("flagClick=",flagPos);
	})
	
})