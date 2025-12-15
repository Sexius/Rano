		function CallError(pageType, errorID) {	// DB연결 실패시 및 페이지 오류
			$.ajax(
				{
					type : "GET"
				,	dataType: "html"
				,	url  : "error.asp"
				,	data : {pageType:pageType,errorID:errorID}
				,	cache : true	//cache : false 일때 _ 파라미터 자동생성
				,	async : false
				,	success : function(data) {
						document.getElementById(errorID).innerHTML = data;
						document.getElementById(errorID).style.display = 'block';
					}
				,	complete : function(object) {

					}
				}
			);

		}
		var itemDealLoading = true;
		function CallItemDealList(svrID, itemFullName, itemOrder, inclusion, curpage) {	// 거래 아이템 조회 리스트
			
			if (itemDealLoading == false)
			{
				return;
			}
			
			document.getElementById('precautions').style.display='none';

			if (svrID != '-1')
			{
				if (CallValidationSubmitSearch(false)==false)	// 서버 선택 유효성 검사
				{
					return;
				}
			}

			$.ajax(
				{
					type : "GET"
				,	dataType: "html"
				,	url  : "itemDealList.asp"
				,	data : {svrID:svrID,itemFullName:itemFullName,itemOrder:itemOrder,inclusion:inclusion,curpage:curpage}
				,	cache : true	//cache : false 일때 _ 파라미터 자동생성
				,	async : false
//				,	headers: { "cache-control": "no-cache","pragma": "no-cache" }
				,	beforeSend : function() {
						itemDealLoading = false;
						document.getElementById('inProgressMsg').style.display = 'block';	// loading 화면 제공
					}
				,	error : function(XHR, textStatus, errorThrown) {
						CallError('normal','itemContents');  // 불러올 수 없음 화면 제공
					}
				,	success : function(data) {
						if (data=='checkOutMsg')
						{
							CallNotService();	//서비스 점검 화면 전환
							return;
						}
						document.getElementById('itemContents').innerHTML = data;
						document.getElementById('itemContents').style.display = 'block';
						document.getElementById('divItemDealList').style.display = 'block';
						document.getElementById('divItemDealView').style.display = 'none'; // 뷰페이지 기본으로 닫음
						document.getElementById('searchResult').style.display = 'block';
					}
				,	complete : function(object) {
						itemDealLoading = true;
						document.getElementById('inProgressMsg').style.display = 'none'; // loading 화면 닫음
					}
				}
			);

		}

		function CallItemDealView(svrID, mapID, ssi, curpage) {	// 거래 아이템 조회 뷰
			
			$.ajax(
				{
					type : "GET"
				,	dataType: "html"
				,	url  : "itemDealView.asp"
				,	data : {svrID:svrID,mapID:mapID,ssi:ssi,curpage:curpage}
				,	cache : true	//cache : false 일때 _ 파라미터 자동생성
				,	async : false
//				,	headers: { "cache-control": "no-cache","pragma": "no-cache" }
				,	beforeSend : function() {
						document.getElementById('inProgressMsg').style.display = 'block';	// loading 화면 제공
					}
				,	error : function(XHR, textStatus, errorThrown) {
						CallError('normal','itemContents'); // 불러올 수 없음 화면 제공
					}
				,	success : function(data) {
						if (data=='checkOutMsg')
						{
							CallNotService(); //서비스 점검 화면 전환
							return;
						}
						document.getElementById('divItemDealView').innerHTML = data;
						document.getElementById('divItemDealView').style.display = 'block';
						document.getElementById('divItemDealList').style.display = 'none';
						document.getElementById('searchResult').style.display = 'none';
					}
				,	complete : function(object) {
						document.getElementById('inProgressMsg').style.display = 'none'; // loading 화면 닫음
					}
				}
			);

		}