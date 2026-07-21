const l = require('/app/node_modules/lucide-react');
const icons = ['Database','Shield','Wifi','Settings','Palette','Globe','Phone','Mail','MessageCircle','QrCode','Unplug','Plug','HardDrive','Check','ExternalLink','FolderOpen','RefreshCw','Upload','Save','Bell','Menu','Sun','Moon'];
icons.forEach(i => console.log(i + ': ' + (typeof l[i])));
