/*
	Function  :拯救小动物
	Author    :WheelChen
	Build_Date:2016-12-24
	Version   :1.0
 */

//1. 公共变量声明块........................................................

    var canvas = document.getElementById("canvas"),
        ctx = canvas.getContext("2d");
    var PLANE_WIDTH = 100,                             //飞机宽度
		PLANE_HEIGHT = 58,                             //飞机高度
		PLANE_TOP = 10,                                //飞机距离canvas顶部高度
        lastGameTime = 0,                              //上一次游戏运行时间
        gameTime = 0,                                  //游戏运行时间
        HP_Pos ={                                       //血条位置
            x:0,
            y:0,
        },
        HP = 50,                                        //血条初始值
        HP_LENGTH = 40,                                 //血条长
        HP_HEIGHT = 5,                                  //血条宽
        SHEEP_WIDTH = 30,                               //羊宽（图片中）
        SHEEP_HEIGHT = 38,                              //羊高（图片中）
        BG_VELOCITY = 50,                               //背景移动速度
        bgOffset = 0,                                   //背景偏移量
        flag = true,                                    //是否放下加血包

        HP_Pos = {                                      //血条位置
            x:0,
            y:0,
        },
		fps = 60,                                       //帧频
		BOX_WIDTH = 41,                                 //箱子的宽
		BOX_HEIGHT = 30,                                //箱子的高
        BOX_HEIGHT_IN_METERS = 8,                       //初始箱子长度默认为8M
    	pixelsPerMeter = (canvas.height - PLANE_HEIGHT - PLANE_TOP) / BOX_HEIGHT_IN_METERS, //将米与像素换算 得出每米多少像素
		GRAVITY_FORCE = 10;  							//重力加速度为10 m/s²
	var spriteSheetPlane = new Image(),					//声明图像飞机精灵表
		sheep = new Image(),                            //声明图像羊精灵表
		box = new Image(),                              //声明图像加血包
        background = new Image(),                       //声明图像背景
		// isPaint = false,
        arrSnow=[],
        snowNum = 0,
		lastUpdateFpsTime = 0,                          //上次更新FPS
        lastCreateSnowTime = 0,                         //上次更新雪花
        lastTime = 0,                                   //上次更新倒计时
		runnerCells = [
            { left: 0, 			   top: 0, width: PLANE_WIDTH-5, height: PLANE_HEIGHT },
            { left: PLANE_WIDTH,   top: 0, width: PLANE_WIDTH-5, height: PLANE_HEIGHT },
            { left: PLANE_WIDTH*2, top: 0, width: PLANE_WIDTH-5, height: PLANE_HEIGHT },
            { left: PLANE_WIDTH*3, top: 0, width: PLANE_WIDTH-5, height: PLANE_HEIGHT },
            { left: PLANE_WIDTH*4, top: 0, width: PLANE_WIDTH-5, height: PLANE_HEIGHT },
            { left: PLANE_WIDTH*5, top: 0, width: PLANE_WIDTH, 	 height: PLANE_HEIGHT },
		], //飞机精灵表
        sheepCells = [
            { left: 0, 			   top: 0,            width: SHEEP_WIDTH, height: SHEEP_HEIGHT },
            { left: SHEEP_WIDTH,   top: 0,            width: SHEEP_WIDTH, height: SHEEP_HEIGHT },
            { left: SHEEP_WIDTH*2, top: 0,            width: SHEEP_WIDTH, height: SHEEP_HEIGHT },
            { left: 0,             top: SHEEP_HEIGHT, width: SHEEP_WIDTH, height: SHEEP_HEIGHT },
            { left: SHEEP_WIDTH,   top: SHEEP_HEIGHT, width: SHEEP_WIDTH, height: SHEEP_HEIGHT },
            { left: SHEEP_WIDTH*2, top: SHEEP_HEIGHT, width: SHEEP_WIDTH, height: SHEEP_HEIGHT },
        ],  //绵羊精灵表

        // Behaviors.................................................
        //雪花飘落行为
        drop = {
            velocitY:5,
            angle:Math.PI/5,
            x:0,
            y:0,

            execute: function (sprite, ctx) {
                //赋予随机下落
                this.angle=Math.random()*Math.PI;
                this.x+= this.velocitY*Math.cos(this.angle);
                this.y+= this.velocitY*Math.sin(this.angle);
                sprite.left=this.x;
                sprite.top=this.y;
            }
        },
        //雪花绘制器
        snowPainter ={
            radious:this.radious||1,
            x:this.x||0,
            y:this.y||0,

            paint: function(sprite,ctx){
                ctx.save();

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radious, 0, Math.PI*2, false);
                ctx.closePath();
                //console.log("x:",this.x);
                ctx.fillStyle = "rgba(254,254,254,0.8)";
                ctx.fill();

                ctx.restore();
            }
        },
        //loading绘制器
        move = {
            lastMove: 0,
            lastAdvance: 0,
            PAGEFLIP_INTERVAL: 300,
            execute: function (sprite, context, time) {
                //向左向右走
                if (this.lastMove !== 0) {
                    if (sprite.toRight)
                        sprite.left += sprite.velocityX *
                            ((time - this.lastMove) / 1000);
                    else if (sprite.toLeft)
                        sprite.left -= sprite.velocityX *
                            ((time - this.lastMove) / 1000);
                }
                if (time - this.lastAdvance > this.PAGEFLIP_INTERVAL) {
                    sprite.painter.advance(sprite);
                    this.lastAdvance = time;
                }
                this.lastMove = time;
            }
        },
        controllPlane={
            lastMove: 0,
            lastAdvance: 0,
            PAGEFLIP_INTERVAL: 60,
            execute: function (sprite, context, time){
                //默认向左自动飞行
                if (time - this.lastAdvance > this.PAGEFLIP_INTERVAL) {
                    sprite.painter.advance(sprite);
                    this.lastAdvance = time;
                }
                if (this.lastMove !== 0) {
                    sprite.left -= sprite.velocityX *
                        ((time - this.lastMove) / 1000);
                    if(sprite.toLeft){                              //往右
                        sprite.left -= 1;

                    }
                    if(sprite.toRight){                             //往左
                        sprite.left += 3;
                    }
                    // sprite.left -= sprite.velocityX/ fps * pixelsPerMeter
                    //     (fallingAnimationTimer.getElapsedTime()/1000);
                    if (sprite.left + PLANE_WIDTH-5 < 0) {
                        sprite.left = canvas.width;
                    }
                    if (sprite.left > canvas.width){
                        sprite.left = 0;
                    }
                }
                this.lastMove = time;

                if(sprite.toTop){
                    sprite.top = sprite.top < PLANE_TOP ? sprite.top : sprite.top-sprite.velocityY;
                }
                if(sprite.toBottom){
                    sprite.top = sprite.top > canvas.height-100 - SHEEP_HEIGHT*2 ?
                                    sprite.top : sprite.top+sprite.velocityY;
                }

            }
        },
        moveBox = {
            lastFrameTime: undefined,

            execute: function (sprite, context, time) {
                var now = +new Date();
                if (this.lastFrameTime == undefined) {
                    this.lastFrameTime = now;
                    return;
                }

                // if (pushAnimationTimer.isRunning()) {
                //     if (arrow === LEFT) sprite.left -= sprite.velocityX / fps;
                //     else                sprite.left += sprite.velocityX / fps;
                //
                //     if (isBallOnLedge()) {
                //         if (pushAnimationTimer.getElapsedTime() > 200) {
                //             pushAnimationTimer.stop();
                //         }
                //     }
                //     else if ( ! fallingAnimationTimer.isRunning()) {
                //         startFalling();
                //         this.lastFrameTime = now;
                //     }
                // }

                if (fallingAnimationTimer.isRunning()) {
                    sprite.left -= sprite.velocityX / fps;
                    sprite.top += sprite.velocityY / fps;
                    sprite.velocityY = GRAVITY_FORCE *
                        (fallingAnimationTimer.getElapsedTime()/1000) * pixelsPerMeter;

                        if (sprite.top > canvas.height || sprite.left+sprite.width < 0) {
                            stopFalling();
                            canvas.addEventListener("click",onFallingBtnClick);
                        }
                    if( sprite.top + sprite.height >= Sheep.top && sprite.top + sprite.height <= Sheep.top + SHEEP_HEIGHT*2
                        && sprite.left >= Sheep.left && sprite.left <= Sheep.left + sprite.width) {
                        objBuffer.play();
                        HP  = HP >= 90 ? 100 : HP + 10;
                        stopFalling();
                        canvas.addEventListener("click", onFallingBtnClick);
                    }
                }
            }
        },
        fallingAnimationTimer = new AnimationTimer(),
        // Sprite....................................................

	// airPlane = new Sprite('airPlane',new SpriteSheetPainter(runnerCells),
	// 						[runInPlace,moveRightToLeft,moveTopOrBottom]),
        airPlane = new Sprite('airPlane',new SpriteSheetPainter(runnerCells),
            [controllPlane]),
	    Box = new Sprite('Box',new ImagePainter("images/Plus_blood_package.png"),[moveBox]),
        Sheep = new Sprite('Sheep',new SpriteSheetPainter(sheepCells),[move]),
        // gameover = new Sprite('gameover',new ImagePainter("images/gameover.png"),[fadeIn]),
// 声明需要使用的HTML元素对象
	objRunBtn = document.getElementById("run"),
	objBg_audio = document.getElementById("bg_audio"),
	objBuffer = document.getElementById("buffer"),
    objFail = document.getElementById("fail"),
	objSuccess = document.getElementById("success");
//2. 函数定义块...........................................................
	//开始运行canvas
	function onRunBtnClick() {
		canvas.style.display="inline";
		objRunBtn.style.visibility='hidden';
        objBg_audio.play();
        window.requestNextAnimationFrame(animate);
    }
    //绘制单个雪花对象
    function snow1(){
        snowNum =arrSnow.length;
        snow=new Sprite('snow',snowPainter,[drop]);
        snow.left=Math.random()*canvas.width;
        snow.top=0;
        snow.width=parseInt(Math.random()*3+1)*2;
        snow.painter.x=snow.left;
        snow.painter.y=snow.top;
        snow.painter.radious=snow.width/2;
        snow.paint(ctx);
        //console.log(snow.painter.x);
        arrSnow.push(snow);

    }
    //画背景
    function drawBackground() {
        bgOffset = bgOffset < canvas.width ?
            bgOffset + BG_VELOCITY/fps : 0;

        ctx.save();
        ctx.translate(-bgOffset, 0);
        ctx.drawImage(background, 0, 0);
        ctx.drawImage(background, background.width-2, 0);
        ctx.restore();
    }
    //画血条
    function drawHP() {
	    HP_Pos.x = Sheep.left + 10;
        HP_Pos.y = Sheep.top - 10;
        ctx.save();
        ctx.fillStyle = "red";
        ctx.strokeRect(HP_Pos.x,HP_Pos.y,HP_LENGTH ,HP_HEIGHT);
        ctx.fillRect(HP_Pos.x,HP_Pos.y,HP_LENGTH*HP/100,HP_HEIGHT);
        ctx.restore();
    }
	function animate(time) {
        fps = calculateFps(time);
        //清除屏幕
		ctx.clearRect(0,0,canvas.width,canvas.height);
		// init.paint();
        drawBackground();
        drawHP();
        // overAnimate();
        airPlane.update(ctx, time);
        Box.update(ctx,time);
        Sheep.update(ctx,time);
        airPlane.paint(ctx);
        Sheep.paint(ctx);
        // if(isPaint)
        	Box.paint(ctx);
        if(time - lastCreateSnowTime > 30) {
            snowNum = arrSnow.length;
            while (snowNum--) {
                var snow = arrSnow[snowNum];

                drop.x = snow.left;
                drop.y = snow.top;
                snow.update(ctx);
                snowPainter.x = snow.left;
                snowPainter.y = snow.top;
                snowPainter.radious = snow.width / 2;
                snow.paint(ctx);
                //删除越界雪花
                if (snowPainter.y > canvas.height || snowPainter.x > canvas.width || snowPainter.x < 0) {
                    arrSnow.splice(snowNum, 1);
                }
            }
            snow1();
            lastCreateSnowTime = time;
        }
        if(time - lastGameTime > 1000){
            gameTime++;
            lastGameTime = time;
            HP -= 5;
            // console.log(1);
        }
        if(gameTime < 30 && HP > 0)
		    window.requestNextAnimationFrame(animate);
        else if(gameTime >= 30 ){
            ctx.save();
            ctx.textAlign = "center";
            ctx.baseline = "middle";
            ctx.font = "30px Petit Formal Script";
            ctx.fillText("游戏结束 成功拯救喜洋洋",canvas.width/2,canvas.height/2);
            objBg_audio.pause();
            objSuccess.play();
            ctx.restore();
        }
        else if(HP <= 0){
            ctx.save();
            ctx.textAlign = "center";
            ctx.baseline = "middle";
            ctx.font = "30px Petit Formal Script";
            ctx.fillText("游戏结束 拯救失败",canvas.width/2,canvas.height/2);
            objBg_audio.pause();
            objFail.play();
            ctx.restore();
        }
	}
    // function overAnimate() {
    //     ctx.save();
    //     gameover.update();
    //     gameover.paint();
    // }
	//计算帧频
	function calculateFps(time) {
		var fps = 1000 / (time - lastUpdateFpsTime);
		lastUpdateFpsTime = time;
		return fps;
	}
	//开始掉落
	function startFalling() {
		fallingAnimationTimer.start();
		Box.velocityY = 0;
		Box.left = airPlane.left + 20;
		Box.top = airPlane.top + PLANE_HEIGHT + 10;
	}
	//加血包停止下落
	function stopFalling() {
		fallingAnimationTimer.stop();
		Box.visible = false;
        // isPaint = false;
        flag = true;
		Box.top = PLANE_TOP + PLANE_HEIGHT ;
		Box.velocityY = 0;
	}
	//加血包开始掉落事件
	function onFallingBtnClick() {
        Box.visible = true;
        // isPaint = true;
        startFalling();
        canvas.removeEventListener("click",onFallingBtnClick);
    }


//3. 事件注册块...........................................................

	objRunBtn.addEventListener("click",onRunBtnClick);
	canvas.addEventListener("click",onFallingBtnClick);
	// window.addEventListener("keydown",onSpaceKeydown);
//控制飞机方向
	window.onkeydown = function (event) {
        switch (event.keyCode){
            case 38:airPlane.toTop = true;break;
            case 40:airPlane.toBottom = true;break;
            case 37:airPlane.toLeft = true;break;
            case 39:airPlane.toRight = true;break;
            case 32:if(flag) {
                onFallingBtnClick();
                flag = false;
            }
        }
    }
    window.onkeyup = function (event) {
        switch (event.keyCode){
            case 38:airPlane.toTop = false;break;
            case 40:airPlane.toBottom = false;break;
            case 37:airPlane.toLeft = false;break;
            case 39:airPlane.toRight = false;break;
        }
    }
//4. 初始化块............................................................
//赋链接
	spriteSheetPlane.src = "images/airplane.png";
	sheep.src = "images/sheep.png";
	box.src = "images/Plus_blood_package.png";
    background.src = "images/background.png";
    // note.src ="images/note.png";
//图片加载并数值初始化
	spriteSheetPlane.onload = function () {
        airPlane.left = canvas.width;
        airPlane.top = 30;
        airPlane.velocityX = 100;
        airPlane.velocityY = 3;
	};
	sheep.onload = function () {
        Sheep.left = canvas.width - SHEEP_WIDTH*2;
        Sheep.top = canvas.height - SHEEP_HEIGHT*2;
        Sheep.toLeft = true;//向左走
        Sheep.toRight = false;//向右走
        Sheep.velocityX = 100;
    };
	box.onload = function () {
        Box.left = canvas.width - 100;
        Box.top = PLANE_TOP + PLANE_HEIGHT + 20;
        Box.width = BOX_WIDTH;
        Box.height = BOX_HEIGHT;
        Box.velocityY = 0 ;
        Box.velocityX  = 350;
    };
	background.onload = function () {};
//音频加载
    objFail.onload = function () {};
    objSuccess.onload = function () {};
	objBg_audio.load();
    objBuffer.load();


