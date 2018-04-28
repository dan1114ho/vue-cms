<template>
    <div class="mb-3">
        <div class="audio-wrapper">
            <div class="audio-player">
                <div class="top">
                    <div class="control">
                        <a href="#" @click.prevent="togglePlayback">
                            <fa v-if="playing" :icon="['fas', 'pause']"/>
                            <fa v-else :icon="['fas', 'play']"/>
                        </a>
                        {{ seek | minsec }} / {{ duration | minsec }}
                    </div>
                    <div class="volume">
                        <div class="icon">
                            <fa :icon="['fas', 'volume-up']"/>
                        </div>
                        <div class="slidecontainer">
                        <input type="range" min="0" max="100" v-model="volumeVal" class="slider" @change="changeVolume" ref="volumeSlider" />
                        </div>
                    </div>
                    <div class="upload">
                        <a href="#" @click="upload">
                            <fa :icon="['fas', 'upload']"/>
                        </a>
                        <div class="lbl">UPLOAD</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <input type="range" min="0" :max="duration" v-model="seekVal" class="slider" @change="changeSeek" ref="seekSlider" />
                </div>
            </div>
        </div>  
    </div>
</template>

<script>
import VueHowler from 'vue-howler'

export default {
    name: 'AudioPlayer',
    
    mixins: [ VueHowler ],

    data: () => ({
        volumeVal: 50,
        seekVal: 0,
    }),

    methods: {
        changeSeek() {
            console.log(this.seek);
            this.setSeek(parseInt(this.seekVal));
            this.drawPlaybackProgress();
        },
        changeVolume() {
            this.setVolume(parseInt(this.volumeVal) / 100);
            this.drawVolumeProgress();
        },
        drawVolumeProgress() {
            let val = parseInt(this.volumeVal) / 100;
            this.$refs.volumeSlider.style.backgroundImage =
                '-webkit-gradient(linear, left top, right top, '
                + 'color-stop(' + val + ', #79acd1), '
                + 'color-stop(' + val + ', #d9d1d1)'
                + ')';
        },
        drawPlaybackProgress() {
            let val = this.seekVal / this.duration;
            this.$refs.seekSlider.style.backgroundImage =
                '-webkit-gradient(linear, left top, right top, '
                + 'color-stop(' + val + ', #79acd1), '
                + 'color-stop(' + val + ', #d9d1d1)'
                + ')';
        },
        upload() {
            this.sources = ['/media/test.mp3'];
        },
    },

    mounted() {
        this.drawVolumeProgress();
    },

    watch: {
        seek(val) {
            this.seekVal = val;
            this.drawPlaybackProgress();
        },
    },
}
</script>

<style lang="scss" scoped>
$audioGray: #d9d1d1;
$blue:    #79acd1 !default;
$darkBlue: #3e4759 !default;

.audio-wrapper { 
    border: 2px solid $darkBlue;
    border-radius: 15px;
    overflow: hidden;
}
.audio-player {
    width: 100%;
    height: 65px;
}
.audio-player .control a { color: #fff; margin-right: 5px; }
.audio-player .control a:hover { color: #d9d1d1; }
.top { 
    height: 50px; 
    display: flex; 
}
.control { 
    flex: 1 1 auto;
    background-color: $darkBlue;
    text-align: center;
    color: #fff;
    font-weight: none;
    padding-top: 12px;
}
.control i { margin-right: 10px; }
.volume { 
    padding: 5px;
    width: 120px; 
    background-color: #fff;  
    border-right: 2px solid $darkBlue;
    color: $darkBlue;
    padding: 15px 10px 0px 5px;
    display: flex;
}
.volume .icon { padding: 0px 5px; }
.upload {
    padding: 5px 5px 5px 5px;
    width: 60px; background-color: #fff;
    text-align: center;
}
.upload .lbl { 
    font-size: 10px;
    color: $darkBlue;
    font-weight: bold;
    line-height: 10px;
}
.audio-player .upload a { color: $blue; font-size: 1.3rem; }
.audio-player .upload a:hover { color: $darkBlue; }

.progress-bar { 
    height: 15px; 
    background-color: $audioGray; 
    border-top: 1px solid #fff; 
}





.slidecontainer {
    flex: 1;
}

.slider {
    -webkit-appearance: none;
    width: 100%;
    height: 13px;
    border-radius: 5px;
    background: $audioGray;
    outline: none;
    opacity: 0.7;
    -webkit-transition: .2s;
    transition: opacity .2s;
}
.slider:hover {
    opacity: 1;
}
.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    border: 1px solid $blue;
}
.slider::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    border: 1px solid $blue;
}

</style>