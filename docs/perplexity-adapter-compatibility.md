# Perplexity Adapter Compatibility

過去のHTTP 400はendpoint、model、messages、max tokens、unsupported parameterの契約不一致候補として扱う。Adapterは`sonar`を固定候補とし、fixture contractだけで正規化する。推測した複数payloadやreal requestは使用しない。
