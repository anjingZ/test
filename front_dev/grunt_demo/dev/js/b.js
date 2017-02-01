// Created by zr8732@126.com  on 2014/10/7.
(function(win){
    var moduleB = {
         init:function(){
            this.a = 1;
            this.b = 2;
        },
         getAdd:function(){
             var self = this;
             self.init();
             // document.getElementById();
             moduleA.add(self.a,self.b)
         }
    };
    moduleB.getAdd();
    return win.moduleB = moduleB;
})(window);
