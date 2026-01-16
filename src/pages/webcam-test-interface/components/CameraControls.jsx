 import React from 'react';
 import Button from '../../../components/ui/Button';

 const CameraControls = ({ 
   isActive, 
   isLoading, 
   onStart, 
   onStop,
   disabled 
 }) => {
   return (
     <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
       {!isActive ? (
         <Button
           variant="default"
           size="lg"
           onClick={onStart}
           loading={isLoading}
           disabled={disabled || isLoading}
           iconName="Camera"
           iconPosition="left"
           className="w-full sm:w-auto min-w-[200px]"
         >
           {isLoading ? 'Requesting Access...' : 'Start Camera'}
         </Button>
       ) : (
         <Button
           variant="destructive"
           size="lg"
           onClick={onStop}
           disabled={isLoading}
           iconName="CameraOff"
           iconPosition="left"
           className="w-full sm:w-auto min-w-[200px]"
         >
           Stop Camera
         </Button>
       )}

       {isActive && (
         <div className="flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 rounded-lg">
           <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
           <span className="text-sm font-medium text-success">Live</span>
            </div>
       )}
       
     </div>
   );
 };

 export default CameraControls;