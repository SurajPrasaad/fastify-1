// Basic mock to prevent crashes on Web
export class RTCPeerConnection {
  addEventListener() { }
  removeEventListener() { }
  addTrack() { }
  createOffer() { return Promise.resolve({}); }
  createAnswer() { return Promise.resolve({}); }
  setLocalDescription() { return Promise.resolve(); }
  setRemoteDescription() { return Promise.resolve(); }
  addIceCandidate() { return Promise.resolve(); }
  close() { }
}

export class RTCIceCandidate { }
export class RTCSessionDescription { }
export class MediaStream {
  getTracks() { return []; }
  getAudioTracks() { return []; }
}

export const mediaDevices = {
  getUserMedia: () => Promise.reject(new Error("getUserMedia not supported in Web mock")),
};

export default {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
};
