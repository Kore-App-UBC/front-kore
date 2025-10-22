package com.renatex314.korefront

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.OutputHandler
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import com.facebook.react.bridge.Promise

class PoseLandmarks(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PoseLandmarks" // The name used to access the module from JavaScript
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
    }

    @ReactMethod
    fun initModel() {
        // Check if the PoseLandmarker has already been initialized
        if (PoseLandmarkerHolder.poseLandmarker != null) {
            // Model is already initialized, send a status update to JavaScript
            val alreadyInitializedParams = Arguments.createMap()
            alreadyInitializedParams.putString("status", "Model already initialized")
            sendEvent("onPoseLandmarksStatus", alreadyInitializedParams)
            return
        }


        // Define the result listener
        val resultListener = OutputHandler.ResultListener { result: PoseLandmarkerResult, inputImage: MPImage ->
            Log.d("PoseLandmarksFrameProcessor", "Detected ${result.landmarks().size} poses")

            val landmarksArray = Arguments.createArray()

            for (poseLandmarks in result.landmarks()) {
                val poseMap = Arguments.createArray()
                for ((index, posemark) in poseLandmarks.withIndex()) {
                    val landmarkMap = Arguments.createMap()
                    landmarkMap.putInt("keypoint", index)
                    landmarkMap.putDouble("x", posemark.x().toDouble())
                    landmarkMap.putDouble("y", posemark.y().toDouble())
                    landmarkMap.putDouble("z", posemark.z().toDouble())
                    poseMap.pushMap(landmarkMap)
                }
                landmarksArray.pushArray(poseMap)
            }

            val params = Arguments.createMap()
            params.putArray("landmarks", landmarksArray)

            sendEvent("onPoseLandmarksDetected", params)
        }

        // Initialize the Pose Landmarker
        try {
            val context: Context = reactApplicationContext
            val baseOptions = BaseOptions.builder()
                    .setModelAssetPath("pose_landmarker.task")
                    .build()

            val poseLandmarkerOptions = PoseLandmarker.PoseLandmarkerOptions.builder()
                    .setBaseOptions(baseOptions)
                    .setRunningMode(RunningMode.LIVE_STREAM)
                    .setResultListener(resultListener)
                    .build()

            PoseLandmarkerHolder.poseLandmarker = PoseLandmarker.createFromOptions(context, poseLandmarkerOptions)

            // Send success event to JS
            val successParams = Arguments.createMap()
            successParams.putString("status", "Model initialized successfully")
            sendEvent("onPoseLandmarksStatus", successParams)

        } catch (e: Exception) {
            Log.e("PoseLandmarksFrameProcessor", "Error initializing PoseLandmarker", e)

            // Send error event to JS
            val errorParams = Arguments.createMap()
            errorParams.putString("error", e.message)
            sendEvent("onPoseLandmarksError", errorParams)
        }
    }

    @ReactMethod
    fun processFrame(frameData: String, promise: Promise) {
        if (PoseLandmarkerHolder.poseLandmarker == null) {
            promise.reject("PoseLandmarkerNotInitialized", "PoseLandmarker is not initialized")
            return
        }

        try {
            // Convert frameData to Bitmap or MPImage
            // Assuming frameData is base64 encoded bitmap or similar
            // For now, we'll assume it's a bitmap byte array or something
            // You might need to adjust this based on how frames are passed
            val bitmap = android.graphics.BitmapFactory.decodeByteArray(
                android.util.Base64.decode(frameData, android.util.Base64.DEFAULT),
                0,
                android.util.Base64.decode(frameData, android.util.Base64.DEFAULT).size
            )
            val mpImage: MPImage = BitmapImageBuilder(bitmap).build()

            val timestamp = System.currentTimeMillis()

            // Call detectAsync
            PoseLandmarkerHolder.poseLandmarker?.detectAsync(mpImage, timestamp)

            promise.resolve("Frame processed successfully")
        } catch (e: Exception) {
            Log.e("PoseLandmarks", "Error processing frame: ${e.message}")
            promise.reject("FrameProcessingError", e.message)
        }
    }
}