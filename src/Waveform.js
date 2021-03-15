import "./styles.css";
import React from "react";

var audioContext = new (window.AudioContext || window.webkitAudioContext)();

export default class extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {};
  }

  componentDidUpdate(prevProps) {
    if (this.props.url && this.props.url !== prevProps.url) {
      this.loadAudioByURL(this.props.url);
    } else if (
      this.props.arrayBuffer &&
      this.props.arrayBuffer !== prevProps.arrayBuffer
    ) {
      console.log("LoadArrayB>1");
      this.loadAudioByArrayBuffer(this.props.arrayBuffer);
    }
  }

  render() {
    return (
      <canvas
        className="waveform"
        height={this.height}
        width={this.props.width}
        ref={this.canvasRef}
        onClick={(e) => this.handleClick(e)}
      ></canvas>
    );
  }

  handleClick(event) {
    if (this.props.onClick) {
      this.props.onClick(event.nativeEvent.offsetY / this.props.pxPerSecond);
    }
  }

  loadAudioByArrayBuffer(ab) {
    audioContext.decodeAudioData(ab, (buffer) => {
      let data = buffer.getChannelData(0);
      const soundLength = data.length / audioContext.sampleRate;
      this.setState({ soundLength });
      this.calcWave(data);
      this.renderWave();
      this.props.onLoad(soundLength);
    });
  }

  loadAudioByURL(url) {
    let audioRequest = new XMLHttpRequest();
    audioRequest.open("GET", url, true);
    audioRequest.responseType = "arraybuffer";
    audioRequest.onload = () => {
      audioContext.decodeAudioData(audioRequest.response, (buffer) => {
        let data = buffer.getChannelData(0);
        const soundLength = data.length / audioContext.sampleRate;
        this.setState({ soundLength });
        this.calcWave(data);
        this.renderWave();
        this.props.onLoad(soundLength);
      });
    };
    audioRequest.send();
  }

  get height() {
    if (this.state.soundLength > 0) {
      return this.state.soundLength * this.props.pxPerSecond;
    } else {
      return 0;
    }
  }

  calcWave(data) {
    var step = Math.ceil(data.length / this.height);
    const wave = [];
    for (var i = 0; i < this.height; i++) {
      var min = 1.0;
      var max = -1.0;
      for (var j = 0; j < step; j++) {
        var datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      wave.push([min, max]);
    }
    this.setState({ wave });
  }

  renderWave() {
    const canvas = this.canvasRef.current;
    const context = canvas.getContext("2d");
    const amp = this.props.width / 2;
    for (var i = 0; i < this.height; i++) {
      context.fillRect(
        (1 + this.state.wave[i][0]) * amp,
        i,
        Math.max(1, (this.state.wave[i][1] - this.state.wave[i][0]) * amp),
        1
      );
    }
  }
}
