/* Pixel character shared by the game and the quick view (same design as the game player). */
(()=>{
  const PAL={O:'#1a1020',H:'#6b4423',S:'#f1c27d',E:'#1a1020',W:'#3ec8c8',P:'#3b4bb5'};
  const SPR=["OOOOOOOO","OHHHHHHO","OHHHHHHO","OSSSSSSO","OSESSESO","OSSSSSSO","OSSOOSSO","OOOOOOOO","OWWWWWWO","OWWWWWWO","OSWWWWSO","OSWWWWSO","OWWWWWWO","OPPOOPPO","OPPOOPPO","OOOOOOOO"];
  function paint(cv){
    const x=cv.getContext('2d');
    x.imageSmoothingEnabled=false;
    x.clearRect(0,0,cv.width,cv.height);
    const ox=Math.floor((cv.width-8)/2), oy=Math.floor((cv.height-16)/2);
    for(let r=0;r<16;r++)for(let k=0;k<8;k++){
      x.fillStyle=PAL[SPR[r][k]];
      x.fillRect(ox+k,oy+r,1,1);
    }
  }
  window.paintAvatar=paint;
  document.querySelectorAll('canvas[data-avatar], #st-av, #av').forEach(paint);
})();
