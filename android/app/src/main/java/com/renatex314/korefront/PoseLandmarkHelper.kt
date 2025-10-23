package com.renatex314.korefront

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate

object PoseLandmarkerHelper {
    var poseLandmarker: PoseLandmarker? = null
}

class PoseLandmarkerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "PoseLandmarkerModule"

    @ReactMethod
    fun initialize(promise: com.facebook.react.bridge.Promise) {
        println("Initializing PoseLandmarkerModule...")

        if (PoseLandmarkerHelper.poseLandmarker != null) {
            promise.resolve("Model already initialized")
            return
        }

        try {
            val baseOptions = BaseOptions.builder()
                .setModelAssetPath("pose_landmarker.task")
                .setDelegate(Delegate.GPU)
                .build()

            val options = PoseLandmarker.PoseLandmarkerOptions.builder()
                .setBaseOptions(baseOptions)
                .setRunningMode(RunningMode.VIDEO)
                .setNumPoses(1)
                .setMinPoseDetectionConfidence(0.5f)
                .setMinPosePresenceConfidence(0.5f)
                .setMinTrackingConfidence(0.5f)
                .build()

            PoseLandmarkerHelper.poseLandmarker = PoseLandmarker.createFromOptions(reactContext, options)
            promise.resolve("Model initialized successfully")
        } catch (e: Exception) {
            promise.reject("ModelInitError", e.message, e)
        }
    }
}