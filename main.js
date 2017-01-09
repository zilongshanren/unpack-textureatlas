'use strict';
// const Fs = require('fire-fs');
// const Async = require('async');
// const Os = require('os');
const Path = require('fire-path');
var sharpPath;
if (Editor.dev) {
  sharpPath = 'sharp';
} else {
  sharpPath = Editor.url('unpack://utils/sharp');
}
const Sharp = require(sharpPath);

module.exports = {
  load () {
    // execute when package loaded
  },

  unload () {
    // execute when package unloaded
  },

  // register your ipc messages here
  messages: {
    'unpack' () {
      
      let currentSelection = Editor.Selection.curSelection('asset');
      if (currentSelection.length > 0) {
        let selectionUUid = currentSelection[0];
        let selectionMeta = Editor.assetdb.loadMetaByUuid(selectionUUid);
        let assetInfo = Editor.assetdb.assetInfoByUuid(selectionUUid);
        var textureAtlasPath = Editor.assetdb.uuidToFspath(selectionMeta.rawTextureUuid);
        var textureAtlasBaseName = Path.dirname(textureAtlasPath);
        var textureAtlasSubMetas = selectionMeta.getSubMetas();
      
        if (assetInfo.type === "sprite-atlas" 
            && selectionMeta.type === "Texture Packer"
            && textureAtlasSubMetas) {

          var ss = Sharp(textureAtlasPath);
          for (var spriteFrame in textureAtlasSubMetas) {
            var spriteFrameObj = textureAtlasSubMetas[spriteFrame];
            Editor.log(spriteFrameObj);

            var isRotated = spriteFrameObj.rotated;
            var originalSize = cc.size(spriteFrameObj.rawWidth, spriteFrameObj.rawHeight);
            var rect = cc.rect(spriteFrameObj.trimX, spriteFrameObj.trimY, spriteFrameObj.width,spriteFrameObj.height);
            var offset = cc.p(spriteFrameObj.offsetX, spriteFrameObj.offsetY);
            var trimmedLeft = offset.x + (originalSize.width - rect.width) / 2;
            var trimmedTop = offset.y - (originalSize.height - rect.height) / 2;


            if(!isRotated) {
              this._reusedRect.x += (rect.x - trimmedLeft);
              this._reusedRect.y += (rect.y + trimmedTop);
            } else {
              var originalX = this._reusedRect.x;
              this._reusedRect.x = rect.x + rect.height - this._reusedRect.y - this._reusedRect.height - trimmedTop;
              this._reusedRect.y = originalX + rect.y - trimmedLeft;
              if (this._reusedRect.y < 0) {
                this._reusedRect.height = this._reusedRect.height + trimmedTop;
              }
            }
          }
          ss.extract({left: 0, top: 0, width: 100, height:100}).rotate(270).toFile(textureAtlasBaseName + "/test.png", (err) => {
            if (err) Editor.error(err);
            Editor.log("test.png is generated.");
          });
          ss.extract({left: 100, top: 100, width: 100, height:100}).rotate(270).toFile(textureAtlasBaseName + "/test2.png", (err) => {
            if (err) Editor.error(err);
            Editor.log("test2.png is generated.");
          });

          Editor.log("selection texture packer asset.");
        } else {
          Editor.Dialog.messageBox({
            type: 'warning',
            buttons: ['OK'],
            titile: 'Unpack Texture Packer Atlas',
            message: 'The selected asset is not a Texture Packer asset!',
            defaultId: 0,
            noLink: true
          });
        }
      } else {
         Editor.Dialog.messageBox({
            type: 'warning',
            buttons: ['OK'],
            titile: 'Unpack Texture Packer Atlas',
            message: 'Please select a Texture Packer asset at first!',
            defaultId: 0,
            noLink: true
          });
      }
      
     
    },
  },
};
