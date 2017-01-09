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
          for (var spriteFrameName in textureAtlasSubMetas) {
            var spriteFrameObj = textureAtlasSubMetas[spriteFrameName];
            Editor.log(spriteFrameObj);

            var isRotated = spriteFrameObj.rotated;
            var originalSize = cc.size(spriteFrameObj.rawWidth, spriteFrameObj.rawHeight);
            var rect = cc.rect(spriteFrameObj.trimX, spriteFrameObj.trimY, spriteFrameObj.width,spriteFrameObj.height);
            var offset = cc.p(spriteFrameObj.offsetX, spriteFrameObj.offsetY);
            var trimmedLeft = offset.x + (originalSize.width - rect.width) / 2;
            var trimmedRight = offset.x - (originalSize.width - rect.width) / 2;
            var trimmedTop = offset.y - (originalSize.height - rect.height) / 2;
            var trimmedBottom = offset.y + (originalSize.height - rect.height) / 2;

            var sharpOptioins = ss.extract({left: rect.x, top: rect.y, width: rect.width, height:rect.height})
                .resize(originalSize.width, originalSize.height)
                .background({r:0, g:0, b: 0, a: 0})
                .extend({top: trimmedTop, bottom: trimmedBottom, left: trimmedLeft, right: trimmedRight});

            if (isRotated) {
              sharpOptioins.rotate(270);
            } else {
              sharpOptioins.rotate(0);
            }

            sharpOptioins.toFile(textureAtlasBaseName + "/" + spriteFrameName, (err) => {
              if (err) Editor.error(err);

              Editor.log(spriteFrameName + " is generated.");
            });
          }
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
