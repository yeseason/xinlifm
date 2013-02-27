var mfm={};

mfm.Player = Backbone.View.extend({
	el:'body',
	
	isPlay: false,
	
	initialize:function(){
		this.player = $('#player');
		this.progress = this.player.find('header progreess');
		this.title = this.player.find('header h1');
		this.detitle = this.player.find('header p');
		this.play = $('#play');
		this.prev = $('#prev');
		this.next = $('#next');
		this.repeat = $('#repeat');
		this.love =$('#love');
		this.description = $('#description');
		this.onResize();
		$(window).resize(this.onResize.bind(this));
	//	this.winswitcher = new mfm.Witcher();
		
		this.port = chrome.extension.connect({name:'fm'});
		this.port.postMessage({cmd:'get'});
		this.port.onMessage.addListener(function(msg){
			switch(msg.cmd){
				case 'progress':
					this.onProgress(msg);
					break;
				case 'set':
					this.render(msg);
					break;
				case'canplaythrougt':
					this.onCanplaythrough(msg);
					break;
				case'error':
					this.message.text(msg.msg);
					break;
			}
		}.bind(this));
	},
	
	render: function(msg){
        this.player.css('backgroundImage', 'url('+ msg.cover +')');
		this.title.html(msg.title);
		this.description.html(msg.content);
		this.detitle.html(msg.word);
		this.love.attr('href','http://fm.xinli001.com/'+msg.id+'/');
		if(msg.isRepeat){
			this.repeat.addClass('on');
		}else{
			this.repeat.removeClass('on');
		}
		if(msg.isPlay){
			this.play.css('backgroundImage','url(images/pause.png)');
		}else{
			this.play.css('backgroundImage','url(images/play.png)');
		}
		this.isPlay =msg.isPlay;
		
	},
		
	events:{
		'keyup': 'hotkey',
        'click #play': 'switch',
        'click #prev': 'onPrev',
        'click #next': 'onNext',
        'click #repeat': 'onRepeat',
	},
		
	onResize: function () {
        this.player.width(window.innerWidth).height(window.innerHeight);
    },
	
	onProgress: function (msg) {
        if (msg.length) {
            this.progress.val(msg.time / msg.length * 100);
            if (msg.lrc) {
                this.message.text(msg.lrc);
            }
        }
    },
    	
   onCanplaythrough: function (msg) {
        this.progress.val(0);
        if (msg.status) {
            this.message.text('');
        }
        else {
            this.message.text('载入中...');
        }
    },
    	
    switch: function (e) {
        var self = this;
        this.isPlay = !this.isPlay;
        if (this.isPlay) {
            this.play.css('backgroundImage', 'url(../images/pause.png)');
        }
        else {
            this.play.css('backgroundImage', 'url(../images/play.png)');
        }
        this.port.postMessage({cmd: 'switch', isPlay: self.isPlay});
        e.preventDefault();
    },
    	
    onPrev: function (e) {
        this.port.postMessage({cmd: 'prev'});
        e.preventDefault();
    },

    onNext: function (e) {
        this.port.postMessage({cmd: 'next'});
        e.preventDefault();
    },

    onRepeat: function (e) {
        if (this.repeat.hasClass('on')) {
            this.repeat.removeClass('on');
            this.port.postMessage({cmd: 'repeat', status: false});
        }
        else {
            this.repeat.addClass('on');
            this.port.postMessage({cmd: 'repeat', status: true});
        }
        e.preventDefault();
    },

    hotkey: function (e) {
        var self = this;
        switch (e.keyCode) {
            case 37:
                this.port.postMessage({cmd: 'prev'});
                break;
            case 39:
                this.port.postMessage({cmd: 'next'});
                break;
            case 32:
                this.switch(e);
                break;
            case 9:
                e.preventDefault();
            break;
        }
    },
});
	
new mfm.Player();