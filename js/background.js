var mfm = {};

mfm.Song = Backbone.Model.extend({
	
	initialize: function(){ },
	
});

mfm.PlayList =Backbone.Collection.extend({
	
	model:mfm.Song,
		
	url:'http://www.xinli001.com/api/fm/broadcasts_json/?key=dc6084ff5471b809c04d3f6494fce3a3',
	
	parse: function (response) {
		var fmsong=[];
		if(response){
			response.data.forEach(function(song){
				fmsong.push(song);
					})
		}
        return fmsong;
    }
	
});

mfm.Player = Backbone.View.extend({
	
	el:'audio',
	
	p:null,
	playList:[],
	current:0,
	cnplaythrough: false,
	isPlay: true,
	isRepeat: false,
	time: 0,
		
initialize: function(){
	this.playList = new mfm.PlayList();
	chrome.browserAction.setPopup({popup:'../popup.html'});
	var self =this;
    var songs=this.fetchSongs(function(){
		this.el.src = this.playList.at(0).get('url');
    }.bind(this));
	chrome.extension.onConnect.addListener(function(port){
	if(port.name === 'fm'){
		this.p = port;
		port.onMessage.addListener(function(msg,port){
		switch ( msg.cmd ){
			case 'switch':
				this.isPlay = msg.isPlay;
				if(msg.isPlay){
					this.el.play();
				}else{
					this.el.pause();
				}
			break;
			case 'next':
				this.current +=1;
				this.el.src = this.playList.at(this.current).get('url');
				if(this.isPlay){ this.el.play();}
				this.time=0;
				port.postMessage(self.getCurrentSongInfo());
			break;
			case 'prev':
				if(this.current){
					this.current -=1;
					this.el.src =this.playList.at(this.current).get('url');
					if(this.isPlay){ this.el.play();}
				}
				port.postMessage(self.getCurrentSongInfo());
			break;
			case 'repeat':
				this.isRepeat = msg.status;
			break;
			case 'get':
				console.log(this.playList.length);
              	if (this.playList.length) {        
                       if (this.isPlay) {
                                this.el.play();
                       }
                    port.postMessage(this.getCurrentSongInfo());
              }
        	break;	
			}
		}.bind(this));
	
	port.onDisconnect.addListener(function(port){
		if(port.name === 'fm'){
			this.p = null;
		}
	}.bind(this));
}
}.bind(this));
},
events:{
	'loadstart':'onloadstart',
	'ended':'onended',
	'stalled':'onstalled',
	'getCurrentSongInfo':'getCurrentSongInfo'
},

onloadstart: function(){
this.canplaythrough =false;
this.time = 0;
this.p && this.p.postMessage({cmd: 'canplaythrough',status:false});

},


onended: function(){
	var self =this;
	if(!this.isRepeat){
		this.fetchSongs('s');
		if(this.playList.at(this.current+1)){
			this.current +=1;
			this.el.src = this.playList.at(this.current).get('url');
		}else{
			this.fetchSongs('p',function(){
				self.current +=1;
				self.el.src = playList.at(self.current).get('url');
				if(self.isPlay){self.el.play();}
				self.time =0;
				self.p && self.p.postMessage(self.getCurrentSongInfo());
			});
		}
	}
	this.time=0;
	this.el.play();
	this.p && this.p.postMessage(this.getCurrentSongInfo());
},

onstalled:function(){
	if(isNaN(this.el.duration)){
			var song =this.playList.at(this.current),
				stalledCount =song.get('stalledCount')||0;
			stalledCount +=1;
			console.log(stalledCount);
	}
},

getCurrentSongInfo: function(){
	var info =this.playList.at(this.current).toJSON();
	info.cmd = 'set';
	info.isPlay = this.isPlay;
	info.isRepeat = this.isRepeat;
	console.log(info);
	return info;
},
fetchSongs: function (fn) {
			var self =this;
            fetch = function () {
                self.playList.fetch({
                	add: 'true',
                    dataType: 'json',
                    success: function () {
                        if (fn) {fn();}
                    },
                    error: function (client) {
                        if (self.p) {self.p.postMessage({cmd: 'error'})}
                    }
                });
            },
            fetch();
}
});

var p = new mfm.Player();