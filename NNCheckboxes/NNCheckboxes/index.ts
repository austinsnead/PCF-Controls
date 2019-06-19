import { IInputs, IOutputs } from "./generated/ManifestTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
import { SpawnSyncOptionsWithBufferEncoding } from "child_process";
type DataSet = ComponentFramework.PropertyTypes.DataSet;

export class NNCheckboxes implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	// Reference to the control container HTMLDivElement
	// This element contains all elements of our custom control example
	private _container: HTMLDivElement;
	// Reference to ComponentFramework Context object
	private _context: ComponentFramework.Context<IInputs>;
	// Event Handler 'refreshData' reference
	private updateModeDiv: HTMLDivElement;
	private parentRecordId: string;
	private parentRecordType: string;
	private _childRecordType: string;
	private labelAttributeName: string;

	private _relationshipSchemaName: string | null;
	/**
	 * Empty constructor.
	 */
	constructor() {

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='starndard', it will receive an empty div element within which it can render its content.
	 */
	public async init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
		// Add control initialization code
		this._context = context;
		this._container = document.createElement("div");
		this.updateModeDiv = document.createElement("div");
		this.updateModeDiv.setAttribute("class", "flex");
		this._container.appendChild(this.updateModeDiv);
		// @ts-ignore
		this.parentRecordId = context.mode.contextInfo.entityId;
		this.parentRecordType = context.parameters.parentEntityLogicalName.raw;
		// TODO Waiting for bug fix : entityTypeName contains child entity name instead of parent
		// context.mode.contextInfo.entityTypeName;

		container.appendChild(this._container);

		this._childRecordType = context.parameters.nnRelationshipDataSet.getTargetEntityType();
		var thisCtrl = this;

		debugger;

		for (var i = 0; i < context.parameters.nnRelationshipDataSet.columns.length; i++) {
			var column = context.parameters.nnRelationshipDataSet.columns[i];
			if (column.alias === "displayAttribute") {
				thisCtrl.labelAttributeName = column.name;
			}
		}

		this._relationshipSchemaName = await thisCtrl.GetNNRelationshipNameByEntityNames();

		context.webAPI.retrieveMultipleRecords(thisCtrl._childRecordType, "?$select=" + thisCtrl._childRecordType + "id," + thisCtrl.labelAttributeName + "&$orderby=" + thisCtrl.labelAttributeName + " asc")
			.then(function (result) {
				for (var i = 0; i < result.entities.length; i++) {
					var record = result.entities[i];

					var divCtrl = document.createElement("div");

					var lblContainer = document.createElement("label");
					lblContainer.setAttribute("class", "container");

					var chk = document.createElement("input");
					chk.setAttribute("type", "checkbox");
					chk.setAttribute("id", record[thisCtrl._childRecordType + "id"]);
					chk.setAttribute("value", record[thisCtrl._childRecordType + "id"]);
					chk.addEventListener("change", function () {
						if (this.checked) {
							var theRecordId = this.id;
							var associateRequest = new class {
								target = {
									id: theRecordId,
									entityType: thisCtrl._childRecordType
								};
								relatedEntities = [
									{
										id: thisCtrl.parentRecordId,
										entityType: thisCtrl.parentRecordType
									}
								];
								relationship = thisCtrl._relationshipSchemaName;
								getMetadata(): any {
									return {
										boundParameter: undefined,
										parameterTypes: {
											"target": {
												"typeName": "mscrm." + thisCtrl._childRecordType,
												"structuralProperty": 5
											},
											"relatedEntities": {
												"typeName": "mscrm." + thisCtrl.parentRecordType,
												"structuralProperty": 4
											},
											"relationship": {
												"typeName": "Edm.String",
												"structuralProperty": 1
											}
										},
										operationType: 2,
										operationName: "Associate"
									};
								}
							}();

							// @ts-ignore
							thisCtrl._context.webAPI.execute(associateRequest)
								.then(
									// @ts-ignore
									function (result) {
										console.log("NNCheckboxes: records were successfully associated")
									},
									// @ts-ignore
									function (error) {
										thisCtrl._context.navigation.openAlertDialog({ text: "An error occured when associating records. Please check NNCheckboxes control configuration" });
									}
								);
						}
						else {
							var theRecordId = this.id;
							var disassociateRequest = new class {
								target = {
									id: theRecordId,
									entityType: thisCtrl._childRecordType
								};
								relatedEntityId = thisCtrl.parentRecordId;
								relationship = thisCtrl._relationshipSchemaName;
								getMetadata(): any {
									return {
										boundParameter: undefined,
										parameterTypes: {
											"target": {
												"typeName": "mscrm." + thisCtrl._childRecordType,
												"structuralProperty": 5
											},
											"relationship": {
												"typeName": "Edm.String",
												"structuralProperty": 1
											}
										},
										operationType: 2,
										operationName: "Disassociate"
									};
								}
							}();

							// @ts-ignore
							thisCtrl._context.webAPI.execute(disassociateRequest)
								.then(
									// @ts-ignore
									function (result) {
										console.log("NNCheckboxes: records were successfully disassociated")
									},
									// @ts-ignore
									function (error) {
										thisCtrl._context.navigation.openAlertDialog({ text: "An error occured when disassociating records. Please check NNCheckboxes control configuration" });
									}
								);
						}
					});

					var selectedIds = context.parameters.nnRelationshipDataSet.sortedRecordIds;

					for (var j = 0; j < selectedIds.length; j++) {
						if (record[thisCtrl._childRecordType + "id"] === selectedIds[j]) {
							chk.checked = true;
						}
					}

					if (context.mode.isControlDisabled) {
						chk.setAttribute("disabled", "disabled");
					}

					var mark = document.createElement("span");
					mark.setAttribute("class", "checkmark");

					lblContainer.innerHTML += record[thisCtrl.labelAttributeName];
					lblContainer.appendChild(chk);
					lblContainer.appendChild(mark);
					divCtrl.appendChild(lblContainer);
					thisCtrl.updateModeDiv.appendChild(divCtrl);
				}
			},
				function (error) {
					if (thisCtrl._relationshipSchemaName == null) {
						thisCtrl._context.navigation.openAlertDialog({ text: "There are no N:N relationships found for '" + thisCtrl._childRecordType + "' & '" + thisCtrl.parentRecordType + "' entities." });
					} else {
						thisCtrl._context.navigation.openAlertDialog({ text: "Wrong N:N relationship schema name ('" + thisCtrl._relationshipSchemaName + "') defined in parameters." });
					}
				});
	}

	public async GetNNRelationshipNameByEntityNames() {
		let schemaNameParameter = this._context.parameters.relationshipSchemaName;
		if (schemaNameParameter != undefined && schemaNameParameter.raw != null) { return Promise.resolve(<string>schemaNameParameter.raw); }
		let entityMetadata = await this._context.utils.getEntityMetadata(this.parentRecordType);
		let nnRelationships = entityMetadata.ManyToManyRelationships.getAll();

		for (let i = 0; i < nnRelationships.length; i++) {
			if ((nnRelationships[i].Entity1LogicalName == this.parentRecordType && nnRelationships[i].Entity2LogicalName == this._childRecordType) ||
				(nnRelationships[i].Entity1LogicalName == this._childRecordType && nnRelationships[i].Entity2LogicalName == this.parentRecordType)) {
				return Promise.resolve(<string>nnRelationships[i].SchemaName);
			}
		}

		return Promise.resolve(null);
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {
		// Add code to update control view
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		// Add code to cleanup control if necessary
	}

}