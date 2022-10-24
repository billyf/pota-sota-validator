<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script type="text/javascript" src="adif-parser.umd.min.js"></script>
<script type="text/javascript" src="chaser_data_pota.js"></script>
<script type="text/javascript" src="chaser_data_sota.js"></script>
<script type="text/javascript" src="process-potasota.js"></script>

<span id="lastUpdatedSpan"></span>

### Choose ADIF file

<input type='file' onchange='onChooseFile(event, onFileLoad.bind(this, "adif_contents"))' />

### or paste contents here:

<textarea id="adif_contents" name="adif_contents" rows="7" cols="80">
</textarea>
<button onclick="processAdif()">Process ADIF</button>

### Type of activation:

<input type="radio" id="pota" name="pota_or_sota" value="pota" checked>
<label for="pota">POTA</label><br>
<input type="radio" id="sota" name="pota_or_sota" value="sota">
<label for="sota">SOTA</label><br>
<input type="radio" id="both" name="pota_or_sota" value="both">
<label for="both">POTA+SOTA</label>

### Results

<span id="status"></span>

<ul id="results_list">
</ul>

