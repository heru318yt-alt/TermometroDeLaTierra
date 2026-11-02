using UnityEngine;

namespace TermometroTierra
{
    public sealed class TierraAudioManager : MonoBehaviour
    {
        public AudioSource effectsSource;
        public AudioSource ambienceSource;
        public AudioClip clickClip;
        public AudioClip successClip;
        public AudioClip errorClip;
        public AudioClip machineClip;
        public AudioClip natureClip;
        public AudioClip vehicleClip;
        [Range(0f, 1f)] public float effectsVolume = 0.72f;
        [Range(0f, 1f)] public float ambienceVolume = 0.2f;
        public bool muted;

        private void Awake()
        {
            ApplyVolumes();
            if (ambienceSource != null && ambienceSource.clip != null && !ambienceSource.isPlaying)
                ambienceSource.Play();
        }

        public void SetMuted(bool value)
        {
            muted = value;
            ApplyVolumes();
        }

        public void ToggleMuted() { SetMuted(!muted); }

        public void Play(string cue)
        {
            if (muted || effectsSource == null) return;
            AudioClip clip = clickClip;
            if (cue == "success") clip = successClip;
            else if (cue == "error") clip = errorClip;
            else if (cue == "machine") clip = machineClip;
            else if (cue == "nature") clip = natureClip;
            else if (cue == "vehicle") clip = vehicleClip;
            if (clip != null) effectsSource.PlayOneShot(clip, effectsVolume);
        }

        private void ApplyVolumes()
        {
            if (effectsSource != null) effectsSource.volume = muted ? 0f : effectsVolume;
            if (ambienceSource != null) ambienceSource.volume = muted ? 0f : ambienceVolume;
        }
    }
}
