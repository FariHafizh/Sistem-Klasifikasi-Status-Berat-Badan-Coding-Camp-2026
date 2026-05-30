import json
import os
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class InferenceConfig:
    model_dir: str
    metadata_file: str = "dnn_metadata.json"
    scaler_file: str = "scaler_obesitas.pkl"
    dnn_model_file: str = "model_dnn_obesitas.keras"
    ml_model_file: str = "model_obesitas.pkl"
    model_type: str = "dnn"  # jenis model: 'dnn' | 'ml'


class ObesityInference:
    def __init__(self, config: InferenceConfig):
        self._config = config
        self._loaded = False
        self._meta: Dict[str, Any] = {}
        self._scaler = None
        self._model = None
        self._ml_model = None
        self._active_model_type: str = ""
        self._feature_cols: list[str] = []
        self._cols_to_scale: list[str] = []
        self._label_map: Dict[int, str] = {}

    @property
    def config(self) -> InferenceConfig:
        return self._config

    @property
    def active_model_type(self) -> str:
        return self._active_model_type or self._config.model_type

    def _abs(self, filename: str) -> str:
        return os.path.join(self._config.model_dir, filename)

    def load(self) -> None:
        if self._loaded:
            return

        try:
            import joblib  # type: ignore
        except Exception as e:
            raise RuntimeError(
                "Dependency 'joblib' belum terpasang. Install dependencies inference terlebih dulu."
            ) from e

        # Rapikan log saat artefak dibuat dengan versi sklearn yang berbeda.
        try:
            import warnings
            from sklearn.exceptions import InconsistentVersionWarning  # type: ignore

            warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
        except Exception:
            pass

        meta_path = self._abs(self._config.metadata_file)
        with open(meta_path, "r", encoding="utf-8") as f:
            self._meta = json.load(f)

        self._feature_cols = list(self._meta["input_features"])
        self._cols_to_scale = list(self._meta["cols_to_scale"])
        self._label_map = {int(k): v for k, v in self._meta["label_map"].items()}

        self._scaler = joblib.load(self._abs(self._config.scaler_file))

        desired = (self._config.model_type or "ml").lower().strip()

        if desired == "dnn":
            try:
                # Import TF hanya saat dibutuhkan
                import tensorflow as tf  # type: ignore

                self._model = tf.keras.models.load_model(self._abs(self._config.dnn_model_file))
                self._active_model_type = "dnn"
            except Exception:
                # Kasus umum: TensorFlow tidak tersedia (mis. versi Python tidak cocok).
                # Pakai model ML agar API tetap bisa dipakai.
                self._ml_model = joblib.load(self._abs(self._config.ml_model_file))
                self._active_model_type = "ml"
        else:
            self._ml_model = joblib.load(self._abs(self._config.ml_model_file))
            self._active_model_type = "ml"

        self._loaded = True

    def preprocess(self, raw: Dict[str, Any]) -> Any:
        try:
            import pandas as pd  # type: ignore
        except Exception as e:
            raise RuntimeError(
                "Dependency 'pandas' belum terpasang. Install dependencies inference terlebih dulu."
            ) from e

        missing = [f for f in self._feature_cols if f not in raw]
        if missing:
            raise ValueError(f"Fitur tidak ditemukan: {missing}")

        df_in = pd.DataFrame([raw])[self._feature_cols]
        df_in[self._cols_to_scale] = self._scaler.transform(df_in[self._cols_to_scale])
        return df_in

    def _predict_dnn(self, df_in: Any) -> Dict[str, Any]:
        try:
            import numpy as np  # type: ignore
        except Exception as e:
            raise RuntimeError(
                "Dependency 'numpy' belum terpasang. Install dependencies inference terlebih dulu."
            ) from e

        proba = self._model.predict(df_in.values, verbose=0)[0]
        pred_num = int(np.argmax(proba))
        pred_label = self._label_map.get(pred_num, "Unknown")
        proba_dict = {self._label_map[i]: round(float(p), 4) for i, p in enumerate(proba)}

        return {
            "prediction": pred_label,
            "prediction_id": pred_num,
            "probabilities": proba_dict,
            "model_used": "DNN",
        }

    def _predict_ml(self, df_in: Any) -> Dict[str, Any]:
        pred_num = int(self._ml_model.predict(df_in)[0])
        pred_label = self._label_map.get(pred_num, "Unknown")
        proba_dict: Dict[str, float] = {}
        if hasattr(self._ml_model, "predict_proba"):
            proba = self._ml_model.predict_proba(df_in)[0]
            proba_dict = {self._label_map[i]: round(float(p), 4) for i, p in enumerate(proba)}

        return {
            "prediction": pred_label,
            "prediction_id": pred_num,
            "probabilities": proba_dict,
            "model_used": "ML",
        }

    def predict(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        self.load()

        df_in = self.preprocess(raw)
        if self._active_model_type == "dnn":
            return self._predict_dnn(df_in)
        return self._predict_ml(df_in)


_default_inference: Optional[ObesityInference] = None


def get_inference() -> ObesityInference:
    """Instance inference tunggal.

    MODEL_DIR default ke '<repo>/Artficial Intelligence' untuk memakai artefak yang ada.
    Gunakan env var MODEL_DIR jika artefak dipindah ke lokasi lain.
    """

    global _default_inference
    if _default_inference is not None:
        return _default_inference

    here = os.path.dirname(os.path.abspath(__file__))
    default_model_dir = os.path.normpath(os.path.join(here, "..", "Artficial Intelligence"))

    model_dir_env = os.environ.get("MODEL_DIR")
    model_dir = (model_dir_env or "").strip() or default_model_dir

    dnn_model_file_env = os.environ.get("DNN_MODEL_FILE")
    dnn_model_file = (dnn_model_file_env or "").strip() or "model_dnn_obesitas.keras"

    model_type = os.environ.get("MODEL_TYPE", "").strip().lower()
    if not model_type:
        # Ikuti preferensi metadata jika env var tidak diset.
        try:
            with open(os.path.join(model_dir, "dnn_metadata.json"), "r", encoding="utf-8") as f:
                meta = json.load(f)
            model_type = str(meta.get("api_model_type", "ml")).strip().lower()
        except Exception:
            model_type = "ml"

    cfg = InferenceConfig(model_dir=model_dir, dnn_model_file=dnn_model_file, model_type=model_type)
    _default_inference = ObesityInference(cfg)
    return _default_inference
