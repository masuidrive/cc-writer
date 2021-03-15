import "./styles.css";
import React from "react";
import Waveform from "./Waveform";
import ReactAudioPlayer from "react-audio-player";
import Draggable from "react-draggable";
import DownloadLink from "react-download-link";
import { printf } from "fast-printf";
import Dropzone from "react-dropzone";

const pxPerSecond = 16;
export default class extends React.Component {
  constructor(props) {
    super(props);
    this.audioRef = React.createRef();
    this.playerPositionRef = React.createRef();
    this.state = {
      soundLength: 0,
      transcripts: [],
      audioUrl: undefined
    };
  }

  componentDidMount() {
    const canvas = this.playerPositionRef.current;
    const context = canvas.getContext("2d");
    context.fillRect(10, 10, 20, 10);
  }

  handleListen(pos) {
    //console.log(e);
    const canvas = this.playerPositionRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, 200, 2000000); //this.state.soundLength * pxPerSecond);
    context.fillRect(0, pos * pxPerSecond, 200, 1);
  }

  handleLoad(length) {
    this.setState({ soundLength: length });
    //console.log(e);
  }

  handleClick(time) {
    this.audioRef.current.audioEl.current.currentTime = time;
    this.audioRef.current.audioEl.current.play();
  }

  selectTime(key, time) {
    this.setState({
      transcript: this.state.transcripts.map((t) => {
        if (t.key === key) {
          t.time = time;
          this.audioRef.current.audioEl.current.currentTime = time;
          this.audioRef.current.audioEl.current.play();
        }
        return t;
      })
    });
  }

  updateText(key, text) {
    this.setState({
      transcript: this.state.transcripts.map((t) => {
        if (t.key === key) {
          t.text = text;
        }
        return t;
      })
    });
  }

  filebody() {
    return this.state.transcripts
      .map((t) => {
        const h = parseInt(t.time / 3600, 10);
        const m = parseInt((t.time % 3600) / 60, 10);
        const s = parseInt(t.time % 60, 10);
        const ms = t.time - parseInt(t.time, 10);
        return printf("[%02d:%02d:%06.3f]\n%s", h, m, s + ms, t.text);
      })
      .join("\n\n");
  }

  loadTranscript(text) {
    let idx = 0;
    this.setState({
      transcripts: text.split(/\n+\[/g).map((line) => {
        const segs = line.match(/(\[|)(\d+):(\d+):(\d+(|[.,]\d+))\]\s*\n(.*)/s);
        return {
          key: idx++,
          time:
            parseInt(segs[2], 10) * 3600 +
            parseInt(segs[3], 10) * 60 +
            parseFloat(segs[4]),
          text: segs[6]
        };
      })
    });
  }

  loadFiles(files) {
    files.forEach((file) => {
      console.log("file: ", file.type);
      if (file.type === "text/plain") {
        let reader = new FileReader();
        reader.onload = () => {
          this.loadTranscript(reader.result);
        };
        reader.readAsText(file);
      } else if (file.type.match(/audio/)) {
        this.setState({ audioUrl: URL.createObjectURL(file) });

        let reader = new FileReader();
        reader.onload = () => {
          console.log("Loaded: audio", reader.result, reader.result.byteLength);
          this.setState({ audioArrayBuffer: reader.result });
        };
        reader.readAsArrayBuffer(file);
      } else {
        console.log("Unknown file: ", file);
      }
    });
  }

  render() {
    return (
      <div className="">
        <Dropzone onDrop={(e) => this.loadFiles(e)} maxFiles={2}>
          {({ getRootProps, getInputProps }) => (
            <section className="container">
              <div {...getRootProps({ className: "dropzone" })}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
            </section>
          )}
        </Dropzone>
        <ReactAudioPlayer
          src={this.state.audioUrl}
          controls
          listenInterval={100}
          onListen={(e) => this.handleListen(e)}
          ref={this.audioRef}
        />
        <div className="waveformWrapper">
          <Waveform
            pxPerSecond={pxPerSecond}
            arrayBuffer={this.state.audioArrayBuffer}
            width={200}
            onClick={(time) => this.handleClick(time)}
            onLoad={(length) => this.handleLoad(length)}
          />
          <canvas
            className="playerPositionCanvas"
            ref={this.playerPositionRef}
            width={200}
            height={this.state.soundLength * pxPerSecond}
          />
          <div className="waveLabels">
            {this.state.transcripts.map((t) => (
              <Draggable
                axis="y"
                defaultPosition={{ x: 0, y: t.time * pxPerSecond }}
                key={t.key}
                onStop={(e, data) =>
                  this.selectTime(t.key, data.y / pxPerSecond)
                }
              >
                <div className="waveLabel">
                  <button class="addButton" onClick={() => this.handleAdd(t)}>
                    Add
                  </button>
                  <textarea
                    className="editTranscript"
                    value={t.text}
                    onChange={(e) => this.updateText(t.key, e.target.value)}
                  />
                </div>
              </Draggable>
            ))}
          </div>
        </div>
        <DownloadLink
          label="Save"
          filename="transcript.txt"
          exportFile={() => this.filebody()}
        />
      </div>
    );
  }
}
