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
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarkerResult
import com.facebook.react.bridge.Promise

class HandLandmarks(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "HandLandmarks" // The name used to access the module from JavaScript
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
    }

    @ReactMethod
    fun initModel() {
        // Check if the HandLandmarker has already been initialized
        if (HandLandmarkerHolder.handLandmarker != null) {
            // Model is already initialized, send a status update to JavaScript
            val alreadyInitializedParams = Arguments.createMap()
            alreadyInitializedParams.putString("status", "Model already initialized")
            sendEvent("onHandLandmarksStatus", alreadyInitializedParams)
            return
        }


        // Define the result listener
        val resultListener = OutputHandler.ResultListener { result: HandLandmarkerResult, inputImage: MPImage ->
            Log.d("HandLandmarksFrameProcessor", "Detected ${result.landmarks().size} hands")

            val landmarksArray = Arguments.createArray()

            for (handLandmarks in result.landmarks()) {
                val handMap = Arguments.createArray()
                for ((index, handmark) in handLandmarks.withIndex()) {
                    val landmarkMap = Arguments.createMap()
                    landmarkMap.putInt("keypoint", index)
                    landmarkMap.putDouble("x", handmark.x().toDouble())
                    landmarkMap.putDouble("y", handmark.y().toDouble())
                    landmarkMap.putDouble("z", handmark.z().toDouble())
                    handMap.pushMap(landmarkMap)
                }
                landmarksArray.pushArray(handMap)
            }

            // Safely get the hand classification (e.g., "Left" or "Right")
            val handName = if (result.handednesses().isNotEmpty() && result.handednesses()[0].isNotEmpty()) {
                result.handednesses()[0][0].categoryName()
            } else {
                ""
            }

            val params = Arguments.createMap()
            params.putArray("landmarks", landmarksArray)
            params.putString("hand", handName)

            sendEvent("onHandLandmarksDetected", params)
        }

        // Initialize the Hand Landmarker
        try {
            val context: Context = reactApplicationContext
            val baseOptions = BaseOptions.builder()
                    .setModelAssetPath("hand_landmarker.task")
                    .build()

            val handLandmarkerOptions = HandLandmarker.HandLandmarkerOptions.builder()
                    .setBaseOptions(baseOptions)
                    .setNumHands(1)
                    .setRunningMode(RunningMode.LIVE_STREAM)
                    .setResultListener(resultListener)
                    .build()

            HandLandmarkerHolder.handLandmarker = HandLandmarker.createFromOptions(context, handLandmarkerOptions)

            // Send success event to JS
            val successParams = Arguments.createMap()
            successParams.putString("status", "Model initialized successfully")
            sendEvent("onHandLandmarksStatus", successParams)

        } catch (e: Exception) {
            Log.e("HandLandmarksFrameProcessor", "Error initializing HandLandmarker", e)

            // Send error event to JS
            val errorParams = Arguments.createMap()
            errorParams.putString("error", e.message)
            sendEvent("onHandLandmarksError", errorParams)
        }
    }

    @ReactMethod
    fun processFrame(frameData: String, promise: Promise) {
        if (HandLandmarkerHolder.handLandmarker == null) {
            promise.reject("HandLandmarkerNotInitialized", "HandLandmarker is not initialized")
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
            HandLandmarkerHolder.handLandmarker?.detectAsync(mpImage, timestamp)

            promise.resolve("Frame processed successfully")
        } catch (e: Exception) {
            Log.e("HandLandmarks", "Error processing frame: ${e.message}")
            promise.reject("FrameProcessingError", e.message)
        }
    }
}