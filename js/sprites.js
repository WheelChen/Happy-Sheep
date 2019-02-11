/*
 * Copyright (C) 2012 David Geary. This code is from the book
 * Core HTML5 Canvas, published by Prentice-Hall in 2012.
 *
 * License:
 *
 * Permission is hereby granted, free of charge, to any person 
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * The Software may not be used to create training material of any sort,
 * including courses, books, instructional videos, presentations, etc.
 * without the express written consent of David Geary.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
*/

// Painters...................................................................

// Painters paint sprites with a paint(sprite, context) method. ImagePainters
// paint an image for their sprite.

var ImagePainter = function (imageUrl) {
   this.image = new Image;
   this.image.src = imageUrl;
};

ImagePainter.prototype = {
   image: undefined,

   paint: function (sprite, context) {
      if (this.image !== undefined) {
         if ( ! this.image.complete) {
            this.image.onload = function (e) {
               sprite.width = this.width;
               sprite.height = this.height;
               
               context.drawImage(this,  // this is image
                  sprite.left, sprite.top,
                  sprite.width, sprite.height);
            };
         }
         else {
           context.drawImage(this.image, sprite.left, sprite.top,
                             sprite.width, sprite.height); 
         }
      }
   }
};

SpriteSheetPainter = function (cells) {
   this.cells = cells;
};

SpriteSheetPainter.prototype = {
   cells: [],
   cellIndex: 0,

   advance: function (sprite) {
      if(sprite.name == "Sheep"){
          if (sprite.left - SHEEP_WIDTH*2 < 0) { //若碰到左边边界
              // sprite.left += sprite.velocityX *
              //     ((time - this.lastMove) / 1000);
              // SheepPos.x = sprite.left ;
              sprite.toRight = true;
              sprite.toLeft = false;
              this.cellIndex = 3;
          }
          if (sprite.left + SHEEP_WIDTH * 2> canvas.width){
              // sprite.left -= sprite.velocityX *
              //     ((time - this.lastMove) / 1000);
              // SheepPos.x = sprite.left;
              sprite.toRight = false;
              sprite.toLeft = true;
              this.cellIndex = 0;
          }
         if (sprite.toRight) {
             if (this.cellIndex == this.cells.length - 1) {
                 this.cellIndex = 3;
             }
             else {
                 this.cellIndex++;
             }
             // console.log("Right");
         }
         else if(sprite.toLeft){
             if (this.cellIndex == 2) {
                 this.cellIndex = 0;
             }
             else {
                 this.cellIndex++;
             }
             // console.log("Left");

         }
          // console.log(this.cellIndex);

      }
      else
         if (this.cellIndex == this.cells.length-1) {
            this.cellIndex = 0;
         }
         else {
            this.cellIndex++;
         }
   },
   
   paint: function (sprite, context) {
      var cell = this.cells[this.cellIndex];
      if(sprite.name == "airPlane")
         context.drawImage(spriteSheetPlane,cell.left, cell.top,
                                          cell.width, cell.height,
                                          sprite.left, sprite.top,
                                          cell.width, cell.height);
      if(sprite.name == "Sheep"){
          context.drawImage(sheep,cell.left, cell.top,
              cell.width, cell.height,
              sprite.left, sprite.top,
              cell.width*2, cell.height*2);
      }
   }
   // paint_2: function (sprite, context) {
   //      var cell = this.cells[this.cellIndex];
   //      context.drawImage(spriteSheetBomb,cell.left, cell.top,
   //          cell.width, cell.height,
   //          sprite.left, sprite.top,
   //          cell.width, cell.height);
   //  }
};

// Sprite Animators...........................................................

// Sprite animators have an array of painters that they succesively apply
// to a sprite over a period of time. Animators can be started with 
// start(sprite, durationInMillis, restoreSprite)

var SpriteAnimator = function (painters, elapsedCallback) {
   this.painters = painters;
   if (elapsedCallback) {
      this.elapsedCallback = elapsedCallback;
   }
};

SpriteAnimator.prototype = {
   painters: [],
   duration: 1000,
   startTime: 0,
   index: 0,
   elapsedCallback: undefined,

   end: function (sprite, originalPainter) {
      sprite.animating = false;

      if (this.elapsedCallback) {
         this.elapsedCallback(sprite);
      }
      else {
         sprite.painter = originalPainter;
      }              
   },
   
   start: function (sprite, duration) {
      var endTime = +new Date() + duration,
          period = duration / (this.painters.length),
          interval = undefined,
          animator = this, // for setInterval() function
          originalPainter = sprite.painter;

      this.index = 0;
      sprite.animating = true;
      sprite.painter = this.painters[this.index];

      interval = setInterval(function() {
         if (+new Date() < endTime) {
            sprite.painter = animator.painters[++animator.index];
         }
         else {
            animator.end(sprite, originalPainter);
            clearInterval(interval);
         }
      }, period); 
   },
};

// Sprites....................................................................

// Sprites have a name, a painter, and an array of behaviors. Sprites can
// be updated, and painted.
//
// A sprite's painter paints the sprite: paint(sprite, context)
// A sprite's behavior executes: execute(sprite, context, time)

var Sprite = function (name, painter, behaviors) {
   if (name !== undefined)      this.name = name;
   if (painter !== undefined)   this.painter = painter;
   if (behaviors !== undefined) this.behaviors = behaviors;
    this.left= 0;
    this.top= 0;
    this.width= 10;
    this.height= 10;
    this.velocityX= 0;
    this.velocityY= 0;
    this.visible=true;
    this.animating= false;
    this.toLeft=false;
    this.toRight=false;
    this.toTop =false;
    this.toBottom = false;
    if (name === "airPlane"){
        this.toTop = false;
        this.toBottom = false;
    }

    if(name === "sheep"){
        this.left = 0;
        this.top = canvas.height - SHEEP_WIDTH*2;
        this.toLeft = true;//向左走
        this.toRight = falses;//向右走
    }
    if(name === "Box"){
        this.visible = false;
    }
    return this;
};

Sprite.prototype = {
	paint: function (context) {
     if (this.painter !== undefined && this.visible) {
        this.painter.paint(this, context);
     }
	},

   update: function (context, time) {
      for (var i = this.behaviors.length; i > 0; --i) {
         this.behaviors[i-1].execute(this, context, time);
      }
   }
};
