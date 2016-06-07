<script type="text/template" id="LastRefreshTemplate">
	<span data-i18n="searchdata1">Search Data as of </span>
	<span id='lastrefreshTime'><%= data.formattedTime %></span>
	<span id='viewmore' class='hide'>
		(<a class='viewmore'><%= data.elapsedTime %></a>)
	</span>
	<span id='workingNote' class='hide'>
		working...
	</span>
</script>

