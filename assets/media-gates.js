/* Provider frames are created only after an explicit Load button click. */
(function(){"use strict";
document.querySelectorAll('[data-media-gate]').forEach(function(gate){
 var button=gate.querySelector('button');
 button.addEventListener('click',function(){
  var target=new URL(gate.dataset.mediaSrc);
  if(target.protocol!=="https:" || !["open.spotify.com","www.youtube.com"].includes(target.hostname)) return;
  var frame=document.createElement('iframe');
  frame.src=target.href;frame.title=gate.dataset.mediaTitle;
  frame.style.width='100%';frame.style.height=gate.dataset.mediaHeight+'px';frame.style.border='0';
  if(target.hostname==='www.youtube.com'){frame.style.height='auto';frame.style.aspectRatio='16 / 9';}
  frame.setAttribute('allow','encrypted-media; fullscreen; picture-in-picture');
  frame.setAttribute('allowfullscreen','');frame.referrerPolicy='strict-origin-when-cross-origin';
  var slot=gate.querySelector('[data-media-slot]');slot.replaceChildren(frame);
  frame.tabIndex=0;frame.focus();
  gate.querySelector('[role="status"]').textContent='Player requested. If it does not load, use the direct link below.';
 });
});
})();
