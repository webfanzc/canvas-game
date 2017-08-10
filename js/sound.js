//音频
var Sound = {
    soundFile: {},
    play: function (status) {
        var sound = this.soundFile[status];
        if (!sound) { //音频未加载，则先加载
            this.load(status);
            sound = this.soundFile[status];
        }
        sound.currentTime = 0;
        sound.play();
    },
    //读取音频
    load: function (id) {
        this.soundFile[id] = new Audio('sound/' + id + '.mp3');
    }

};
