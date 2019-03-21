sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"jquery.sap.global",
	"sap/m/ObjectMarker",
	"sap/m/MessageToast",
	"sap/m/UploadCollectionParameter",
	"sap/m/library",
	"sap/ui/model/json/JSONModel", //collega il controller ai file di modelli.json
	"sap/ui/core/format/FileSizeFormat",
	'sap/m/MessageBox'
], function (Controller, jQuery, ObjectMarker, MessageToast, UploadCollectionParameter, MobileLibrary, JSONModel, FileSizeFormat,
	MessageBox) {
	"use strict";

	return Controller.extend("pabz.me.PresentazioneMobilitaElettrica.controller.View1", {

		//this.getView().getModel("i18n").getResourceBundle().getText("testo_i18n");

		uploadJSON: {},
		ArrayId: ["CartaIdentita", "Preventivi", "Dichiarazioni", "Pagamenti", "Altro"],
		onInit: function () {
			//this.getView().setModel(new sap.ui.model.json.JSONModel("model/emptyModel.json")); //collega il controller all'emptyModel.json. Necessita della libreria
			//"sap/ui/model/json/JSONModel" e della variabile JSONModel nella function()
			this.getView().setModel(new JSONModel({
				"maximumFilenameLength": 80,
				"maximumFileSize": 10,
				"mode": MobileLibrary.ListMode.SingleSelectMaster,
				"uploadEnabled": true,
				"uploadButtonVisible": true,
				"enableEdit": true,
				"enableDelete": true,
				"visibleEdit": true,
				"visibleDelete": true,
				"listSeparatorItems": [
					MobileLibrary.ListSeparators.All,
					MobileLibrary.ListSeparators.None
				],
				"showSeparators": MobileLibrary.ListSeparators.All,
				"listModeItems": [{
					"key": MobileLibrary.ListMode.SingleSelectMaster,
					"text": "Single"
				}, {
					"key": MobileLibrary.ListMode.MultiSelect,
					"text": "Multi"
				}]
			}), "settings");

			this.getView().setModel(new JSONModel({
				"items": ["jpg", "txt", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "pdf", "png"],
				"selected": ["jpg", "txt", "ppt", "pptx", "doc", "docx", "xls", "xlsx", "pdf", "png"]
			}), "fileTypes");

			// Sets the text to the label
			this.byId(this.ArrayId[0]).addEventDelegate({
				onBeforeRendering: function () {
					this.byId("attachmentTitle" + this.ArrayId[0]).setText(this.getAttachmentTitleText(this.ArrayId[0]));
				}.bind(this)
			});
			this.byId(this.ArrayId[1]).addEventDelegate({
				onBeforeRendering: function () {
					this.byId("attachmentTitle" + this.ArrayId[1]).setText(this.getAttachmentTitleText(this.ArrayId[1]));
				}.bind(this)
			});
			this.byId(this.ArrayId[2]).addEventDelegate({
				onBeforeRendering: function () {
					this.byId("attachmentTitle" + this.ArrayId[2]).setText(this.getAttachmentTitleText(this.ArrayId[2]));
				}.bind(this)
			});
			this.byId(this.ArrayId[3]).addEventDelegate({
				onBeforeRendering: function () {
					this.byId("attachmentTitle" + this.ArrayId[3]).setText(this.getAttachmentTitleText(this.ArrayId[3]));
				}.bind(this)
			});
			this.byId(this.ArrayId[4]).addEventDelegate({
				onBeforeRendering: function () {
					this.byId("attachmentTitle" + this.ArrayId[4]).setText(this.getAttachmentTitleText(this.ArrayId[4]));
				}.bind(this)
			});

		},

		//richiamo al servizio userInfoSet
		onUserInfo: function () {

			var oModel = this.getView().getModel(); //variabile oModel relativa al modello di default=emptyModel
			var data = oModel.getData(); //dati dell'emptyModel
			if (data.piva != "" & data.fiscalCode != "") { //controllo se i campi dell'emptyModel sono valorizzati
				var oDataModel = this.getView().getModel("oData"); //dati dal backend, quindi dal servizio di dati relativi agli oData ->l.16 manifest.json

				var sPath = "/userInfoSet(Piva='" + data.piva + "',Cf='" + data.fiscalCode + "')"; //Path per la chiamata al servizio con le chiavi
				oDataModel.read(sPath, {
					"success": function (oData) {
						oModel.setProperty("/name", oData.Nome); //associazione della propriety name presa dagli oData alla propiety /name
						oModel.setProperty("/surname", oData.Cognome);
						oModel.setProperty("/owner", oData.RagioneSociale);
						oModel.setProperty("/piva", oData.Piva);
						oModel.setProperty("/fiscalCode", oData.Cf);
						oModel.setProperty("/state", oData.Landx);
						oModel.setProperty("/region", oData.Region);
						oModel.setProperty("/postcode", oData.Cap);
						oModel.setProperty("/city", oData.Citta);
						oModel.setProperty("/district", oData.Bezei);
						oModel.setProperty("/street", oData.Indirizzo);
						oModel.setProperty("/streetNumber", oData.NumeroCivico);
						oModel.setProperty("/telephone", oData.Telefono);
						oModel.setProperty("/mail", oData.Email);
						oModel.setProperty("/pec", oData.EmailPec);
						oModel.refresh();
					}.bind(this),
					"error": function (err) {
						//MessageBox.error(err.message);
					}
				});
			}

			//controllo per l'input della data (relativo a Marca da bollo)
			var dataMB = oModel.getProperty("/stamp_duty_date"); //chiamo la variabile
			if (dataMB !== "") {
				dataMB = new Date(dataMB); //trasformazione da stringa ad oggetto
				oModel.setProperty("/stamp_duty_date", dataMB); //set della propriety con la nuova variabile perchè non teneva in memoria il cambiamento
				oModel.refresh(); //refresh del modello
			}
		},

		// ---------------------------------------------------------------------------------- Start funzioni WF 
		completeTask: function (approvalStatus) {

			var taskId = this.getOwnerComponent().taskId;
			var instanceId = this.getOwnerComponent().instanceId;
			var token = this._fetchToken();
			var oModel = this.getView().getModel();
			oModel.setProperty("/toConfirm", approvalStatus);

			if (instanceId === null) {
				oModel.setProperty("/Azienda", oModel.getData().piva);
				// creo il task id
				$.ajax({
					url: "/bpmworkflowruntime/rest/v1/workflow-instances",
					method: "POST",
					contentType: "application/json",
					async: false,
					data: JSON.stringify({
						definitionId: "mobilitaeettrica",
						context: oModel.getData()
					}),
					headers: {
						"X-CSRF-Token": token
					},
					success: function (result, xhr, data) {
						this.getOwnerComponent().instanceId = result.id;
						instanceId = result.id;
					}.bind(this)
				});
			}

			if (!approvalStatus) {
				this.saveContext(instanceId, true);
			} else {
				if (taskId === null) {
					this._taskIdfromInstance(instanceId, token, true);
				} else {
					this._completeTask(taskId, oModel, token);
				}
			}
		},

		_completeTask: function (taskId, oModel, token) {

			var dataContext;

			// se chiamo la Patch devo completare il task!
			dataContext = JSON.stringify({
				status: "COMPLETED",
				context: oModel.getData()
			});

			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/task-instances/" + taskId,
				method: "PATCH",
				contentType: "application/json",
				async: false,
				data: dataContext,
				headers: {
					"X-CSRF-Token": token
				},
				success: function (result, xhr, data) {
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("TaskSaved"));
					this.getView().setBusy(false);
					this.getOwnerComponent().taskId = null;
				}.bind(this),
				error: function (oError) {}
			});
		},

		_taskIdfromInstance: function (instanceId, token, toComplete) {

			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/task-instances?workflowInstanceId=" + instanceId,
				method: "GET",
				async: false,
				headers: {
					"X-CSRF-Token": token
				},
				success: function (result, xhr, data) {
					this.getOwnerComponent().taskId = result[result.length - 1].id;
					if (toComplete) {
						var oModel = this.getView().getModel();
						this._completeTask(this.getOwnerComponent().taskId, oModel, token);
					}
				}.bind(this),
				error: function (oError) {}
			});
		},

		_fetchToken: function () {
			var token;
			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/xsrf-token",
				method: "GET",
				async: false,
				headers: {
					"X-CSRF-Token": "Fetch"
				},
				success: function (result, xhr, data) {
					token = data.getResponseHeader("X-CSRF-Token");
				}
			});
			return token;
		},

		getTaskIdParam: function () {
			return jQuery.sap.getUriParameters().get("taskid");
		},

		getInstanceIdParam: function () {
			return jQuery.sap.getUriParameters().get("wfId");
		},

		getInstanceId: function (taskId) {

			var token = this._fetchToken();
			var instanceId = null;
			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/task-instances/" + taskId,
				method: "GET",
				async: false,
				headers: {
					"X-CSRF-Token": token
				},
				success: function (result, xhr, data) {
					instanceId = result.workflowInstanceId;
				}
			});
			return instanceId;

		},

		getTaskId: function (instanceId) {

			var token = this._fetchToken();
			var taskId = null;
			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/task-instances?workflowInstanceId=" + instanceId,
				method: "GET",
				async: false,
				headers: {
					"X-CSRF-Token": token
				},
				success: function (result, xhr, data) {
					taskId = result[result.length - 1].id;
				}
			});
			return taskId;

		},

		deleteDraft: function (instanceId) {
			this.deleteContext(instanceId);
			var arrayBtn = ["btn_del", "btn_save", "btn_confirm"];
			var arrayBtnLength = arrayBtn.length;
			var token = this._fetchToken();
			var statusDel = JSON.stringify({
				"status": "CANCELED"
			});
			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/workflow-instances/" + instanceId,
				method: "PATCH",
				contentType: "application/json",
				async: false,
				headers: {
					"X-CSRF-Token": token
				},
				data: statusDel,
				success: function (result, xhr, data) {
					this.getView().setBusy(false);
					var i;
					for (i = 0; i < arrayBtnLength; i++) {
						this.getView().byId(arrayBtn[i]).setEnabled(false);
					}
					MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("OpComp"));

				}.bind(this),
				error: function (data) {
					var saveResult = this.saveContext(instanceId, false);
					if (saveResult) {
						MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("OpFallRes"));
					} else {
						MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("OpFall"));
					}
				}.bind(this)
			});
		},

		saveContext: function (instanceId, fromCompleteTask) {
			var successfulSave;
			var token = this._fetchToken();
			var oModel = this.getView().getModel();
			var oData = oModel.getData();
			var contextData = JSON.stringify(oData);
			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/workflow-instances/" + instanceId + "/context",
				method: "PUT",
				contentType: "application/json",
				async: false,

				headers: {
					"X-CSRF-Token": token
				},
				data: contextData,
				success: function (result, xhr, data) {
					this.getView().setBusy(false);
					successfulSave = true;
					if (fromCompleteTask) {
						MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("BozSalv"));
					}
				}.bind(this),
				error: function (data) {
					this.getView().setBusy(false);
					successfulSave = false;
					if (fromCompleteTask) {
						MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("OpFallSalv"));
					}
				}.bind(this)
			});
			return successfulSave;
		},

		deleteContext: function (instanceId) {
			var successfulOp;
			var token = this._fetchToken();
			var contextData = JSON.stringify({});
			$.ajax({
				url: "/bpmworkflowruntime/rest/v1/workflow-instances/" + instanceId + "/context",
				method: "PUT",
				contentType: "application/json",
				async: false,
				headers: {
					"X-CSRF-Token": token
				},
				data: contextData,
				success: function (result, xhr, data) {
					successfulOp = true;
				},
				error: function (data) {
					successfulOp = false;
				}
			});
			return successfulOp;
		},
		// ---------------------------------------------------------------------------------- End funzioni WF 

		// ---------------------------------------------------------------------------------- Start Azioni Toolbar
		onSave: function () {
			this.getView().setBusy(true);
			if (!this.onCheck()) {
				this.completeTask(false);
			} else {
				this.getView().setBusy(false);
				var msg = this.getView().getModel("i18n").getResourceBundle().getText("MsgErr");
				MessageToast.show(msg);
			}
		},

		onDelete: function () {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			var wfId = this.getOwnerComponent().instanceId;
			MessageBox.warning(
				this.getView().getModel("i18n").getResourceBundle().getText("Del"), {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					styleClass: bCompact ? "sapUiSizeCompact" : "",
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.OK) {
							this.getView().setBusy(true);
							this.deleteDraft(wfId);
						} else {
							MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("OpAnn"));
						}
					}.bind(this)
				}
			);
		},

		onConfirm: function () {
			this.getView().setBusyIndicatorDelay(0);
			this.getView().setBusy(true);
			if (!this.onCheck()) {

				//messaggio alla conferma   warning with two actions

				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.warning(
					this.getView().getModel("i18n").getResourceBundle().getText("Conf"), {
						actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: function (sAction) {
							if (sAction === MessageBox.Action.OK) {
								this.completeTask(false); //inserire nell'azione in risposta al ok
								this.requestCreation(); //richiamo alla funzione in risposta al ok -Batch

							} else {
								this.getView().setBusy(false);
								MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("OpAnn"));
							}
						}.bind(this)
					}
				);
			} else {
				this.getView().setBusy(false);
				var msg = this.getView().getModel("i18n").getResourceBundle().getText("MsgErr");
				MessageToast.show(msg);
			}

		},

		//Creazione domanda CRM

		requestCreation: function () {

			var oModel = this.getView().getModel("oData");
			oModel.setUseBatch(true); //chiamata a gruppo di processi che parte solo quando viene chiamato l'insieme
			var changeSetId = "abc"; //setto un id al set 
			oModel.setDeferredGroups([changeSetId]); //collegato al Batch
			var mParameters = { //nomino i parametri
				"groupId": changeSetId,
				"changeSetId": changeSetId
			};

			var batchSuccess = function (oData) { //funzioni di successo ed insuccesso legati alla chiamata Batch

				this.getView().setBusy(false);
				//gestire gli errori da backend, anche se la chiamata è andata a buon fine
				var response = oData.__batchResponses[0].response;
				if (response !== undefined) {
					if (response.statusCode !== '200') { //status 200 è il tipo di errore ricercato
						var json = JSON.parse(oData.__batchResponses[0].response.body);
						var oBodyModel = new JSONModel(json);
						var error = oBodyModel.getData().error.message.value;
						sap.m.MessageBox.error(error);
						return;
					}
				}
				//fine gestione errori

				var reqGuid = oData.__batchResponses[0].__changeResponses[0].data.Guid;
				this.getView().getModel().setProperty("/guid", reqGuid);
				this.completeTask(true); //completa il task, completa il workflow
				this._getRequestData(); //legge 
				this.getView().byId("btn_save").setEnabled(false);
				this.getView().byId("btn_confirm").setEnabled(false);
				this.getView().byId("btn_del").setEnabled(false);
			}.bind(this);

			var batchError = function (err) {
				this.getView().setBusy(false);
				sap.m.MessageBox.error(err.message);
			}.bind(this);

			//creazione della coda di processo, con le funzioni che si andranno a richiamare
			this._odataNuovaRichiesta(mParameters);
			this._odataPosRichiesta(mParameters);
			this._odataDocCreate(mParameters);
			oModel.submitChanges({
				"groupId": changeSetId,
				//"changeSetId": changeSetId,
				"success": batchSuccess,
				"error": batchError
			});
		},

		//mapping di NuovaRichiesta. gestione della CRM relativa ai dati di input nella scheda "anagrafica"
		_odataNuovaRichiesta: function (param) {

			var oModel = this.getView().getModel();
			var oDataModel = this.getView().getModel("oData");
			var entity = {};

			//vanno mappati gli input della parte anagrafica: Piva,fiscalCode, settore dell'impresa richiedente, lingua, dichiarazione dell'impresa

			entity["CfDelegato"] = oModel.getProperty("/fiscalCode");
			entity["Piva"] = oModel.getProperty("/piva");
			entity["ProcessType"] = "ZAPE";
			entity["SettoreA"] = oModel.getProperty("/craft");
			entity["SettoreI"] = oModel.getProperty("/industry");
			entity["SettoreC"] = oModel.getProperty("/trade");
			entity["SettoreS"] = oModel.getProperty("/services");
			entity["SettoreL"] = oModel.getProperty("/freelance");
			entity["SettoreT"] = oModel.getProperty("/turism");
			entity["Zzfld00000z"] = oModel.getProperty("/stamp_duty_id"); //marca da bollo
			if (oModel.getProperty("/stamp_duty_date") !== "") {
				entity["Zzfld000010"] = oModel.getProperty("/stamp_duty_date"); //se la marca da bollo è valorizzata->mapping della data
			}

			if (oModel.getProperty("/italian")) {
				entity["Zzfld00001t"] = "I";
			}
			if (oModel.getProperty("/german")) {
				entity["Zzfld00001t"] = "D";
			}
			if (oModel.getProperty("/classImpP")) {
				entity["Zzfld000031"] = "A";
			}
			if (oModel.getProperty("/classImpM")) {
				entity["Zzfld000031"] = "B";
			}
			if (oModel.getProperty("/classImpG")) {
				entity["Zzfld000031"] = "C";
			}
			entity["Zzfld00002x"] = this.getOwnerComponent().instanceId; //passa in backend in valore del wfId
			oDataModel.create("/nuovaRichiestaSet", entity, param); //crea il collegamento CRM della /nuovaRichiestaSet
		},

		//mapping di PosRichiesta. gestione della CRM relativa ai dati di input nella scheda "anagrafica"

		_odataPosRichiesta: function (param) {

			var oModel = this.getView().getModel();
			var oDataModel = this.getView().getModel("oData");
			var entity = {};

			var listA = oModel.getProperty("/listA");

			for (var i in listA) {

				if (listA[i].importoEuro !== "") {
					entity = {};
					//entity[""] = listA[i].tipologia;
					entity["Importo"] = listA[i].importoEuro[0].toString();
					//entity[""] = listA[i].numero[0].toString();
					entity["Description"] = listA[i].descrizione.substring(0, 40);
					oDataModel.create("/posizioniRichiestaSet", entity, param); //crea il collegamento CRM della /nuovaRichiestaSet
				}

			}
		},

		_odataDocCreate: function (param) {
			var i;
			var length = this.ArrayId.length;
			var oDataModel = this.getView().getModel("oData");
			var oFileUploaded = this.getView().getModel().getData();
			for (i = 0; i < length; i++) {
				var entity;
				var property = oFileUploaded[this.ArrayId[i]];
				var tipologia = this.switchTipologia(this.ArrayId[i]);
				for (var k in property) {
					entity = {};
					entity["Tipologia"] = tipologia;
					entity["Nome"] = property[k].fileName;
					entity["Mimetype"] = property[k].fileMimeType;
					entity["Estensione"] = property[k].fileExtension;
					entity["Content"] = property[k].fileContent;
					//entity["Description"] = property[k].fileId;
					//entity["Dimensione"] = property[k].fileDimension;
					//entity["DataCaricamento"] = property[k].fileUploadDate;

					oDataModel.create("/documentiRichiestaSet", entity, param);
				}
			}
		},

		//funzione somma degli importi in euro e restituisce 
		onTotalListA: function () {
			var oModel = this.getView().getModel();
			var listA = oModel.getProperty("/listA");
			var totale = oModel.getProperty("/totalListA");

			//ciclo sulla seconda colonna della listA. Se l'importo Euro non è vuoto, cicla su tutti gli elemeti e li somma.
			totale = 0; //string diventa un numero
			for (var i in listA) {
				if (listA[i].importoEuro !== '' && !Number.isNaN(listA[i].importoEuro[0])) { //inserito il check sul controllo del carattere numerico
					totale = totale + listA[i].importoEuro[0];
				}
			}

			oModel.setProperty("/totalListA", totale);
			oModel.refresh(); //refresh del modello
		},
		_getRequestData: function () {

			this.getView().byId("btn_reqData").setVisible(true);

			var data = this.getView().getModel().getData();
			var guid = data.guid;

			var oDataModel = this.getView().getModel("oData");
			var sPath = "/nuovaRichiestaSet(Guid='" + guid + "',ObjectId='')";
			var richiestaCreata = this.getView().getModel("i18n").getResourceBundle().getText("RichiestaCreata");
			oDataModel.read(sPath, {
				"success": function (oData) {
					//Richiesta creata Codice protocollo: &1 - Codice fascicolo: &2
					var attributiRichiesta = this.getView().getModel("i18n").getResourceBundle().getText("AttributiRichiesta");
					attributiRichiesta = attributiRichiesta.replace("&1", oData.Zzfld00001g);
					attributiRichiesta = attributiRichiesta.replace("&2", oData.Zzfld000019);
					sap.m.MessageToast.show(richiestaCreata + '\n' + attributiRichiesta);
				}.bind(this),
				"error": function (err) {
					//è in errore il recupero degli attributi ma la richiesta è stata creata
					sap.m.MessageToast.show(richiestaCreata);
				}
			});

		},

		// ---------------------------------------------------------------------------------- End Azioni Toolbar

		formatAttribute: function (sValue) {
			if (jQuery.isNumeric(sValue)) {
				return FileSizeFormat.getInstance({
					binaryFilesize: false,
					maxFractionDigits: 1,
					maxIntegerDigits: 3
				}).format(sValue);
			} else {
				return sValue;
			}
		},

		// ---------------------------------------------------------------------------------- Start File Uploader

		arrayJSONStringify: function (array) {
			for (var i = 0; i < array.length; i++) {
				if (typeof array[i] !== "string") {
					array[i] = JSON.stringify(array[i]);
				}
			}
			return array;
		},

		arrayJSONParse: function (array) {
			for (var i = 0; i < array.length; i++) {
				array[i] = JSON.parse(array[i]);
			}
			return array;

		},

		switchProperty: function (oUploadCollection) {
			var property;
			var i = 0;
			var length = this.ArrayId.length;
			for (i = 0; i < length; i++) {
				if (oUploadCollection.indexOf(this.ArrayId[i]) !== -1) {
					property = this.ArrayId[i];
				}
			}
			return property;
		},

		switchTipologia: function (property) {
			var tipologia;
			switch (property) {
			case "CartaIdentita":
				tipologia = "ZDOC_IDENT";
				break;
			case "Preventivi":
				tipologia = "ZDOC_PREVE";
				break;
			case "Dichiarazioni":
				tipologia = "ZDOC_DICHI";
				break;
			case "Pagamenti":
				tipologia = "ZDOC_PAGAM";
				break;
			case "Altro":
				tipologia = "ZDOC_ALTRO";
				break;
			}
			return tipologia;
		},

		onChange: function (oEvent) {
			var that = this;
			var oUploadCollection = oEvent.getSource();
			// Header Token
			var oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: "securityTokenFromModel"
			});
			oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

			var reader = new FileReader();
			var file = oEvent.getParameter("files")[0];
			that.uploadJSON = {};
			that.uploadJSON.fileId = jQuery.now().toString();
			that.uploadJSON.fileName = file.name;
			that.uploadJSON.fileMimeType = file.type;
			that.uploadJSON.fileDimension = (file.size / 1000).toFixed(2) + " kB";
			that.uploadJSON.fileExtension = file.name.split(".")[1];
			that.uploadJSON.fileUploadDate = new Date(jQuery.now()).toLocaleDateString();
			reader.onload = function (e) {
				that.uploadJSON.fileContent = e.target.result.substring(5 + that.uploadJSON.fileMimeType.length + 8);
			};

			reader.onerror = function (e) {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("errUpl"));
			};

			reader.readAsDataURL(file);

		},

		base64toBlob: function (base64Data, contentType) {
			contentType = contentType || '';
			var sliceSize = 1024;
			var byteCharacters = atob(base64Data);
			var bytesLength = byteCharacters.length;
			var slicesCount = Math.ceil(bytesLength / sliceSize);
			var byteArrays = new Array(slicesCount);

			for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
				var begin = sliceIndex * sliceSize;
				var end = Math.min(begin + sliceSize, bytesLength);
				var bytes = new Array(end - begin);

				for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
					bytes[i] = byteCharacters[offset].charCodeAt(0);
				}

				byteArrays[sliceIndex] = new Uint8Array(bytes);
			}

			return new Blob(byteArrays, {
				type: contentType
			});
		},

		onFileDeleted: function (oEvent) {
			var oUploadCollection = oEvent.getSource().getId();
			this.deleteItemById(oEvent.getParameter("documentId"), oUploadCollection);
		},

		deleteItemById: function (sItemToDeleteId, sUploadCollection) {
			var property = this.switchProperty(sUploadCollection);
			var oData = this.byId(sUploadCollection).getModel().getData();
			var aItems = jQuery.extend(true, {}, oData)[property];
			jQuery.each(aItems, function (index) {
				if (aItems[index] && aItems[index].fileId === sItemToDeleteId) {
					aItems.splice(index, 1);
				}
			});
			this.byId(sUploadCollection).getModel().getData()[property] = aItems;
			this.byId(sUploadCollection).getModel().refresh();

			this.byId("attachmentTitle" + property).setText(this.getAttachmentTitleText(property));
		},

		onFilenameLengthExceed: function () {
			MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("fileLenghtExc"));
		},

		onFileRenamed: function (oEvent) {
			var oUploadCollection = oEvent.getSource().getId();
			var property = this.switchProperty(oUploadCollection);
			var oData = this.byId(oUploadCollection).getModel().getData();
			var aItems = jQuery.extend(true, {}, oData)[property];
			var sDocumentId = oEvent.getParameter("documentId");
			jQuery.each(aItems, function (index) {
				if (aItems[index] && aItems[index].fileId === sDocumentId) {
					aItems[index].fileName = oEvent.getParameter("item").getFileName();
				}
			});
			this.byId(oUploadCollection).getModel().getData()[property] = aItems;
			this.byId(oUploadCollection).getModel().refresh();
		},

		onFileSizeExceed: function () {
			MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("fileSizeExc"));
		},

		onTypeMissmatch: function () {
			MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("typeMiss"));
		},

		onUploadComplete: function (oEvent) {
			var that = this;
			var oUploadCollection = oEvent.getSource().getId();
			var property = this.switchProperty(oUploadCollection);
			var oData = this.byId(oUploadCollection).getModel().getData();

			var blobForURL = this.base64toBlob(that.uploadJSON.fileContent, that.uploadJSON.fileMimeType);
			var fileURL = URL.createObjectURL(blobForURL);
			oData[property].unshift({
				"fileId": that.uploadJSON.fileId,
				"fileName": that.uploadJSON.fileName,
				"fileMimeType": that.uploadJSON.fileMimeType,
				"fileDimension": that.uploadJSON.fileDimension,
				"fileExtension": that.uploadJSON.fileExtension,
				"fileUploadDate": that.uploadJSON.fileUploadDate,
				"fileContent": that.uploadJSON.fileContent,
				"fileThumbnailUrl": "",
				"fileURL": fileURL,
				"attributes": [{
					"title": "Data di caricamento",
					"text": that.uploadJSON.fileUploadDate,
					"active": false
				}, {
					"title": "Dimensione",
					"text": that.uploadJSON.fileDimension,
					"active": false
				}],
				"selected": false
			});
			this.byId(oUploadCollection).getModel().refresh();
			that.uploadJSON = {};

			// Sets the text to the label
			this.byId("attachmentTitle" + property).setText(this.getAttachmentTitleText(property));
		},

		onBeforeUploadStarts: function (oEvent) {
			// Header Slug
			var oCustomerHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
		},

		onSelectAllPress: function (oEvent) {
			var sUploadCollection = oEvent.getSource().getId();
			var oUploadCollection = this.byId(sUploadCollection);
			if (!oEvent.getSource().getPressed()) {
				this.deselectAllItems(oUploadCollection);
				oEvent.getSource().setPressed(false);
				oEvent.getSource().setText("Select all");
			} else {
				this.deselectAllItems(oUploadCollection);
				oUploadCollection.selectAll();
				oEvent.getSource().setPressed(true);
				oEvent.getSource().setText("Deselect all");
			}
			this.onSelectionChange(oEvent);
		},

		deselectAllItems: function (oUploadCollection) {
			var aItems = oUploadCollection.getItems();
			for (var i = 0; i < aItems.length; i++) {
				oUploadCollection.setSelectedItem(aItems[i], false);
			}
		},

		getAttachmentTitleText: function (oUploadCollection) {
			var aItems = this.byId(oUploadCollection).getItems();
			var nAllegati = this.getView().getModel("i18n").getResourceBundle().getText("Nallegati"); //i18n gestito con variabile dinamica
			nAllegati = nAllegati.replace("%var%", aItems.length);

			return nAllegati;
		},

		onModeChange: function (oEvent) {
			var oSettingsModel = this.getView().getModel("settings");
			if (oEvent.getParameters().selectedItem.getProperty("key") === MobileLibrary.ListMode.MultiSelect) {
				oSettingsModel.setProperty("/visibleEdit", false);
				oSettingsModel.setProperty("/visibleDelete", false);
				this.enableToolbarItems(true);
			} else {
				oSettingsModel.setProperty("/visibleEdit", true);
				oSettingsModel.setProperty("/visibleDelete", true);
				this.enableToolbarItems(false);
			}
		},

		onSelectionChange: function (oEvent) {
			var oUploadCollection = oEvent.getSource().getId();
			var property = this.switchProperty(oUploadCollection);
			var oData = this.byId(oUploadCollection).getModel().getData();
			var aSelectedItems = this.byId(property).getSelectedItems();
			if (aSelectedItems.length !== 0) {
				var selectedItemId = aSelectedItems[0].getDocumentId();
				var length = this.ArrayId.length;
				var i;
				var k;
				for (i = 0; i < length; i++) {
					var field = oData[this.ArrayId[i]];
					for (k in field) {
						if (field[k].selected === true && field[k].fileId !== selectedItemId) {
							field[k].selected = false;
						}
					}
				}
			}
		},

		onDownloadSelectedItems: function (oEvent) {
			var oUploadCollection = oEvent.getSource().getId();
			var property = this.switchProperty(oUploadCollection);
			var oData = this.byId(oUploadCollection).getModel().getData();
			var aItems = jQuery.extend(true, {}, oData)[property];
			var aSelectedItems = this.byId(property).getSelectedItems();
			if (aSelectedItems.length !== 0) {
				var downloadableContent;
				jQuery.each(aItems, function (index) {
					if (aItems[index] && aItems[index].fileId === aSelectedItems[0].getDocumentId()) {
						downloadableContent = aItems[index];
					}
				});
				var blob = this.base64toBlob(downloadableContent.fileContent, downloadableContent.fileMimeType);
				var objectURL = URL.createObjectURL(blob);

				var link = document.createElement('a');
				link.style.display = 'none';
				document.body.appendChild(link);

				link.href = objectURL;
				link.href = URL.createObjectURL(blob);
				link.download = downloadableContent.fileName;
				link.click();
			}
		},

		onCheck: function () {
			var p = false;
			return p;
		}
	});
});