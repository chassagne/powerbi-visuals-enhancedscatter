/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import "./../style/visual.less";

import lodashClone from "lodash.clone";

import powerbi from "powerbi-visuals-api";

// d3
import { Selection as d3Selection, select as d3Select } from "d3-selection";
import { AxisDomain as d3AxisDomain, axisBottom as d3AxisBottom, axisLeft as d3AxisLeft, axisRight as d3AxisRight } from "d3-axis";
import { symbol as d3Symbol, symbolCircle as d3SymbolCircle } from "d3-shape";
import { ScaleLinear as d3ScaleLiear } from "d3-scale";
import { rgb as d3Rgb, hsl as d3Hsl } from "d3-color";
import { max as d3Max, min as d3Min } from "d3-array";
import "d3-transition";

import { ExternalLinksTelemetry } from "./telemetry";

type Selection<T1, T2 = T1> = d3Selection<any, T1, any, T2>;

// powerbi
import Fill = powerbi.Fill;
import DataView = powerbi.DataView;
import IViewport = powerbi.IViewport;
import ValueRange = powerbi.ValueRange;
import NumberRange = powerbi.NumberRange;
import DataViewObject = powerbi.DataViewObject;
import DataViewObjects = powerbi.DataViewObjects;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import PrimitiveValue = powerbi.PrimitiveValue;
import ValueTypeDescriptor = powerbi.ValueTypeDescriptor;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;

import IColorPalette = powerbi.extensibility.IColorPalette;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

// powerbi.visuals
import ISelectionId = powerbi.visuals.ISelectionId;

import IVisual = powerbi.extensibility.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

// powerbi.extensibility.utils.dataview
import { dataRoleHelper as DataRoleHelper } from "powerbi-visuals-utils-dataviewutils";
import getMeasureIndexOfRole = DataRoleHelper.getMeasureIndexOfRole;
import getCategoryIndexOfRole = DataRoleHelper.getCategoryIndexOfRole;

// powerbi.extensibility.utils.svg
import * as SVGUtil from "powerbi-visuals-utils-svgutils";
import IMargin = SVGUtil.IMargin;
import ISize = SVGUtil.shapesInterfaces.ISize;
import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;
import manipulation = SVGUtil.manipulation;

// powerbi.extensibility.utils.chart
import { legend as legendModule, legendInterfaces, OpacityLegendBehavior, legendBehavior, axisInterfaces, axis, dataLabelInterfaces, dataLabelUtils } from "powerbi-visuals-utils-chartutils";
import ILegend = legendInterfaces.ILegend;
import LegendPosition = legendInterfaces.LegendPosition;
import LegendData = legendInterfaces.LegendData;
import LegendDataPoint = legendInterfaces.LegendDataPoint;
import IAxisProperties = axisInterfaces.IAxisProperties;
import TickLabelMargins = axisInterfaces.TickLabelMargins;
import ILabelLayout = dataLabelInterfaces.ILabelLayout;
import LabelTextProperties = dataLabelUtils.LabelTextProperties;
import getLabelFormattedText = dataLabelUtils.getLabelFormattedText;
import LegendBehavior = legendBehavior.LegendBehavior;
import createLegend = legendModule.createLegend;

// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter, double } from "powerbi-visuals-utils-typeutils";
import equalWithPrecision = double.equalWithPrecision;

// powerbi.extensibility.utils.interactivity
import { interactivityBaseService as interactivityService, interactivitySelectionService } from "powerbi-visuals-utils-interactivityutils";
import appendClearCatcher = interactivityService.appendClearCatcher;
import IInteractiveBehavior = interactivityService.IInteractiveBehavior;
import IInteractivityService = interactivityService.IInteractivityService;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;

// powerbi.extensibility.utils.formatting
import { textMeasurementService as tms, valueFormatter } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = valueFormatter.IValueFormatter;
import textMeasurementService = tms;
import svgEllipsis = textMeasurementService.svgEllipsis;
import measureSvgTextWidth = textMeasurementService.measureSvgTextWidth;
import measureSvgTextHeight = textMeasurementService.measureSvgTextHeight;
import estimateSvgTextHeight = textMeasurementService.estimateSvgTextHeight;
import getTailoredTextOrDefault = textMeasurementService.getTailoredTextOrDefault;

// powerbi.extensibility.utils.color
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

// powerbi.extensibility.utils.tooltip
import { createTooltipServiceWrapper, ITooltipServiceWrapper, TooltipEnabledDataPoint } from "powerbi-visuals-utils-tooltiputils";

import { BehaviorOptions, VisualBehavior } from "./behavior";

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { EnableCategoryLabelsCardSettings, EnableLegendCardSettings, EnhancedScatterChartSettingsModel, ScatterChartAxisCardSettings } from "./enhancedScatterChartSettingsModel";

import {
    EnhancedScatterChartData,
    EnhancedScatterChartDataPoint,
    EnhancedScatterChartMeasureMetadata,
    EnhancedScatterChartMeasureMetadataIndexes,
    EnhancedScatterDataRange,
    EnhancedScatterChartRadiusData,
    CalculateScaleAndDomainOptions,
    ChartAxesLabels,
    ElementProperties
} from "./dataInterfaces";
import { tooltipBuilder } from "./tooltipBuilder";
import { BaseDataPoint } from "powerbi-visuals-utils-interactivityutils/lib/interactivityBaseService";
import { yAxisPosition } from "./yAxisPosition";

interface ShapeFunction {
    (value: any): string;
}

interface TextProperties {
    text?: string;
    fontFamily: string;
    fontSize: string;
    fontWeight?: string;
    fontStyle?: string;
    fontVariant?: string;
    whiteSpace?: string;
}

export class EnhancedScatterChart implements IVisual {
    private static MaxMarginFactor: number = 0.25;

    private static AnimationDuration: number = 0;

    private static LabelMargin: number = 8;

    private static AxisGraphicsContextClassName: string = "axisGraphicsContext";
    private static ClassName: string = "enhancedScatterChart";
    private static MainGraphicsContextClassName: string = "mainGraphicsContext";
    private static AxisFontSize: number = 11;

    private static BubbleRadius = 3 * 2;

    private static MinSizeRange = 200;
    private static MaxSizeRange = 3000;

    private static AreaOf300By300Chart = 90000;

    private static DataLabelXOffset: number = 2;
    private static DataLabelYOffset: number = 1.8;

    private static TextProperties: TextProperties = {
        fontFamily: "helvetica, arial, sans-serif",
        fontSize: PixelConverter.toString(EnhancedScatterChart.AxisFontSize),
    };

    private static MinAmountOfTicks: number = 0;
    private static MinAmountOfCategories: number = 0;
    private static MinAmountOfValues: number = 0;

    private static MinIndex: number = 0;

    private static EmptyString: string = "";

    private static DefaultBackgroundPosition: number = 0;

    private static DefaultSelectionStateOfTheDataPoint: boolean = false;
    private static DefaultContentPosition: number = 8;

    private static DefaultColumnId: number = 0;

    private static MinAmountOfDataPointsInTheLegend: number = 1;

    private static isScrollbarVisible: boolean = false;

    private static DefaultBubbleRadius: number = 0;

    private static BubbleRadiusDivider: number = 2;

    private static DefaultBubbleRatio: number = 1;

    private static DefaultProjectedSize: number = 0;
    private static MinDelta: number = 0;
    private static ProjectedSizeFactor: number = 2;

    private static RadiusMultiplexer: number = 4;

    private static DefaultAxisXTickPadding: number = 5;
    private static DefaultAxisYTickPadding: number = 10;

    private static MinAnimationDuration: number = 0;

    private static DefaultPosition: number = 0;

    private static MinImageViewport: IViewport = {
        width: 0,
        height: 0
    };

    private static DefaultMargin: IMargin = {
        top: 8,
        right: 0,
        bottom: 25,
        left: 0
    };

    private static MinViewport: IViewport = {
        width: 0,
        height: 0
    };

    private static DefaultMarginValue: number = 1;

    private static MaxIterations: number = 2;
    private static DefaultNumIterations: number = 0;
    private static DefaultValueOfDoneWithMargins: boolean = false;

    private static AxisSide: number = 10;
    private static SecondYAxisSide: number = 15;
    private static SecondAxisSide: number = 20;
    private static XMaxOffset: number = 12;
    private static AdditionalXMaxOffset: number = 18;

    private static DefaultSizeMeasure: number = 0;

    private static EmptyDataValue: number = 0;

    private static DefaultCategoryAxisFillColor: string = "#333";

    private static TextAnchor: string = "middle";

    public static SvgScrollableSelector: ClassAndSelector = createClassAndSelector("svgScrollable");

    public static ShowLinesOnAxisSelector: ClassAndSelector = createClassAndSelector("showLinesOnAxis");
    public static HideLinesOnAxisSelector: ClassAndSelector = createClassAndSelector("hideLinesOnAxis");

    public static XAxisSelector: ClassAndSelector = createClassAndSelector("x axis");
    public static YAxisSelector: ClassAndSelector = createClassAndSelector("y axis");

    public static TickSelector: ClassAndSelector = createClassAndSelector("tick");
    public static ZeroLineSelector: ClassAndSelector = createClassAndSelector("zero-line");

    private static DotSelector: ClassAndSelector = createClassAndSelector("dot");
    private static ImageSelector: ClassAndSelector = createClassAndSelector("img");

    private static ScatterMarkersSelector: ClassAndSelector = createClassAndSelector("ScatterMarkers");
    private static MarkerShapeSelector: ClassAndSelector = createClassAndSelector("markershape");
    private static MarkerImageSelector: ClassAndSelector = createClassAndSelector("markerimage");

    private static XAxisLabelSelector: ClassAndSelector = createClassAndSelector("xAxisLabel");
    private static YAxisLabelSelector: ClassAndSelector = createClassAndSelector("yAxisLabel");

    private static AxisLabelOffset: number = 2;
    private static YAxisLabelTransformRotate: string = "rotate(-90)";
    private static DefaultDY: string = "1em";

    private static DefaultAxisOffset: number = 0;

    private static MinAxisValue: number = 0;
    private static MaxAxisValue: number = 10;

    private static OuterPadding: number = 0;

    private static NumberSignZero: number = 0;
    private static NumberSignPositive: number = 1;

    public static MaxTranslateValue: number = 1e+25;
    public static MinTranslateValue: number = 1e-25;

    public static DefaultBubbleOpacity = 0.85;
    public static DimmedBubbleOpacity = 0.4;

    public static ColumnCategory: string = "Category";
    public static ColumnSeries: string = "Series";
    public static ColumnX: string = "X";
    public static ColumnY: string = "Y";
    public static ColumnColorFill: string = "ColorFill";
    public static ColumnShape: string = "Shape";
    public static ColumnXStart: string = "XStart";
    public static ColumnXEnd: string = "XEnd";
    public static ColumnYStart: string = "YStart";
    public static ColumnYEnd: string = "YEnd";

    public static R2: number = 2;
    public static R3: number = 3;
    public static R5: number = 5;
    public static R6: number = 6;
    public static R10: number = 10;
    public static R12: number = 12;

    public static RMask: number = 1;
    public static RMaskResult: number = 0;

    private tooltipServiceWrapper: ITooltipServiceWrapper;

    private formattingSettings: EnhancedScatterChartSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    private hasHighlights: boolean;

    private legend: ILegend;

    private element: HTMLElement;
    private svgScrollable: Selection<any>;
    private axisGraphicsContext: Selection<any>;
    private axisGraphicsContextScrollable: Selection<any>;
    private xAxisGraphicsContext: Selection<any>;
    private backgroundGraphicsContext: Selection<any>;
    private yAxisGraphicsContext: Selection<any>;
    private svg: Selection<any>;
    private mainGraphicsSVGSelection: Selection<any>;
    private mainGraphicsContext: Selection<any>;
    private clearCatcher: Selection<any>;
    private mainGraphicsG: Selection<any>;


    private data: EnhancedScatterChartData;
    private axisFillValue: Fill;

    private xAxisProperties: IAxisProperties;
    private yAxisProperties: IAxisProperties;
    private colorPalette: ISandboxExtendedColorPalette;

    private interactivityService: IInteractivityService<BaseDataPoint>;
    private eventService: IVisualEventService;
    private selectionManager: ISelectionManager;
    private yAxisOrientation: string;

    private scrollY: boolean = true;
    private scrollX: boolean = true;

    private visualHost: IVisualHost;

    private bottomMarginLimit: number;
    private leftRightMarginLimit: number;
    private isXScrollBarVisible: boolean;
    private isYScrollBarVisible: boolean;
    private ScrollBarWidth = 10;

    private behavior: IInteractiveBehavior = new VisualBehavior();

    private keyArray: string[] = [];

    private isHighContrast: boolean;

    private foregroundColor: string;
    private backgroundColor: string;
    private foregroundSelectedColor: string;
    private hyperlinkColor: string;

    private localizationManager: ILocalizationManager;

    private telemetry: ExternalLinksTelemetry;

    private _margin: IMargin;
    private get margin(): IMargin {
        return this._margin || { left: 0, right: 0, top: 0, bottom: 0 };
    }

    private set margin(value: IMargin) {
        this._margin = {...{}, ...value};
        this._viewportIn = EnhancedScatterChart.substractMargin(this.viewport, this.margin);
    }

    private _viewport: IViewport;
    private get viewport(): IViewport {
        return this._viewport || { width: 0, height: 0 };
    }

    private set viewport(value: IViewport) {
        this._viewport = {...{}, ...value};
        this._viewportIn = EnhancedScatterChart.substractMargin(this.viewport, this.margin);
    }

    private _viewportIn: IViewport;
    private get viewportIn(): IViewport {
        return this._viewportIn || this.viewport;
    }

    private get legendViewport(): IViewport {
        return this.legend.getMargins();
    }

    private static substractMargin(viewport: IViewport, margin: IMargin): IViewport {
        return {
            width: Math.max(
                viewport.width - (margin.left + margin.right),
                EnhancedScatterChart.MinViewport.width),
            height: Math.max(
                viewport.height - (margin.top + margin.bottom),
                EnhancedScatterChart.MinViewport.height)
        };
    }

    private static getDefinedNumberValue(value: any): number {
        return isNaN(value) || value === null
            ? EnhancedScatterChart.DefaultPosition
            : value;
    }

    private static getDefinedNumberByCategoryId(column: DataViewValueColumn, index: number, valueTypeDescriptor: ValueTypeDescriptor): number {
        const columnValue: PrimitiveValue = column.values[index];
        const isDate: boolean = valueTypeDescriptor && valueTypeDescriptor.dateTime;
        const value: PrimitiveValue = isDate ? new Date(<any>columnValue) : columnValue;

        return column
            && column.values
            && !(columnValue === null)
            && !isNaN(<number>value)
            ? Number(value)
            : null;
    }

    constructor(options: VisualConstructorOptions) {
        this.init(options);
    }

    public init(options: VisualConstructorOptions): void {
        this.element = options.element;
        this.visualHost = options.host;
        this.colorPalette = options.host.colorPalette;

        this.localizationManager = options.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);

        this.isHighContrast = this.colorPalette.isHighContrast;
        if (this.isHighContrast) {
            this.foregroundColor = this.colorPalette.foreground.value;
            this.backgroundColor = this.colorPalette.background.value;
            this.foregroundSelectedColor = this.colorPalette.foregroundSelected.value;
            this.hyperlinkColor = this.colorPalette.hyperlink.value;
        }

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            this.visualHost.tooltipService,
            this.element
        );

        this.selectionManager = this.visualHost.createSelectionManager();
        this.eventService = options.host.eventService;

        this.margin = {
            top: EnhancedScatterChart.DefaultMarginValue,
            right: EnhancedScatterChart.DefaultMarginValue,
            bottom: EnhancedScatterChart.DefaultMarginValue,
            left: EnhancedScatterChart.DefaultMarginValue
        };

        this.yAxisOrientation = yAxisPosition.left;

        this.svg = d3Select(this.element)
            .append("svg")
            .classed(EnhancedScatterChart.ClassName, true);

        this.axisGraphicsContext = this.svg
            .append("g")
            .classed(EnhancedScatterChart.AxisGraphicsContextClassName, true);

        this.svgScrollable = this.svg
            .append("svg")
            .classed(EnhancedScatterChart.SvgScrollableSelector.className, true);

        this.axisGraphicsContextScrollable = this.svgScrollable
            .append("g")
            .classed(EnhancedScatterChart.AxisGraphicsContextClassName, true);

        this.clearCatcher = appendClearCatcher(this.axisGraphicsContextScrollable);

        const axisGroup: Selection<any> = this.scrollY
            ? this.axisGraphicsContextScrollable
            : this.axisGraphicsContext;

        this.xAxisGraphicsContext = this.scrollY
            ? this.axisGraphicsContext
                .append("g")
                .classed(EnhancedScatterChart.XAxisSelector.className, true)
            : this.axisGraphicsContextScrollable
                .append("g")
                .classed(EnhancedScatterChart.XAxisSelector.className, true);

        this.yAxisGraphicsContext = axisGroup
            .append("g")
            .classed(EnhancedScatterChart.YAxisSelector.className, true);

        this.xAxisGraphicsContext.classed(
            EnhancedScatterChart.ShowLinesOnAxisSelector.className,
            this.scrollY
        );

        this.yAxisGraphicsContext.classed(
            EnhancedScatterChart.ShowLinesOnAxisSelector.className,
            this.scrollX
        );

        this.xAxisGraphicsContext.classed(
            EnhancedScatterChart.HideLinesOnAxisSelector.className,
            !this.scrollY
        );

        this.yAxisGraphicsContext.classed(
            EnhancedScatterChart.HideLinesOnAxisSelector.className,
            !this.scrollX
        );

        this.interactivityService = createInteractivitySelectionService(this.visualHost);

        this.legend = createLegend(
            this.element,
            false,
            this.interactivityService,
            true,
            undefined,
            this.colorPalette.isHighContrast
                ? new OpacityLegendBehavior()
                : new LegendBehavior(),
        );

        this.mainGraphicsG = this.axisGraphicsContextScrollable
            .append("g")
            .classed(EnhancedScatterChart.MainGraphicsContextClassName, true);

        this.mainGraphicsSVGSelection = this.mainGraphicsG.append("svg");
        this.mainGraphicsContext = this.mainGraphicsSVGSelection.append("g");

        this.telemetry = new ExternalLinksTelemetry(this.visualHost.telemetry);

        this.adjustMargins();
    }

    private adjustMargins(): void {
        // Adjust margins if ticks are not going to be shown on either axis
        const xAxis: HTMLElement = this.element.getElementsByClassName(EnhancedScatterChart.XAxisSelector.className).item(0) as HTMLElement;

        if (axis.getRecommendedNumberOfTicksForXAxis(this.viewportIn.width) === EnhancedScatterChart.MinAmountOfTicks
            && axis.getRecommendedNumberOfTicksForYAxis(this.viewportIn.height) === EnhancedScatterChart.MinAmountOfTicks
        ) {

            this.margin = {
                top: EnhancedScatterChart.DefaultMarginValue,
                right: EnhancedScatterChart.DefaultMarginValue,
                bottom: EnhancedScatterChart.DefaultMarginValue,
                left: EnhancedScatterChart.DefaultMarginValue
            };

            xAxis.hidden = true;
        } else {
            xAxis.hidden = false;
        }
    }

    // eslint-disable-next-line max-lines-per-function
    public parseData(
        dataView: DataView,
        colorPalette: IColorPalette,
        visualHost: IVisualHost,
        interactivityService: IInteractivityService<BaseDataPoint>,
    ): EnhancedScatterChartData {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(EnhancedScatterChartSettingsModel, dataView);
        const settings: EnhancedScatterChartSettingsModel = this.formattingSettings;

        this.parseSettings(new ColorHelper(colorPalette));

        if (!this.isDataViewValid(dataView)) {
            return this.getDefaultData(settings);
        }

        let categoryValues: any[],
            categoryFormatter: IValueFormatter,
            categoryObjects: DataViewObjects[];

        const dataViewCategorical: DataViewCategorical = dataView.categorical,
            categories: DataViewCategoryColumn[] = dataViewCategorical.categories || [],
            dataValues: DataViewValueColumns = dataViewCategorical.values,
            hasDynamicSeries: boolean = !!dataValues.source,
            grouped: DataViewValueColumnGroup[] = dataValues.grouped(),
            dvSource: DataViewMetadataColumn = dataValues.source,
            scatterMetadata: EnhancedScatterChartMeasureMetadata = EnhancedScatterChart.getMetadata(categories, grouped),
            categoryIndex: number = scatterMetadata.idx.category,
            useShape: boolean = false,
            useCustomColor: boolean = scatterMetadata.idx.colorFill >= EnhancedScatterChart.MinIndex;

        if (dataViewCategorical.categories
            && dataViewCategorical.categories.length > 0
            && dataViewCategorical.categories[categoryIndex]
        ) {
            const mainCategory: DataViewCategoryColumn = dataViewCategorical.categories[categoryIndex];
            categoryValues = mainCategory.values;
            categoryFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(mainCategory.source),
                value: categoryValues[0],
                value2: categoryValues[categoryValues.length - 1]
            });

            categoryObjects = mainCategory.objects;
        }
        else {
            categoryValues = [null];
            // creating default formatter for null value (to get the right string of empty value from the locale)
            categoryFormatter = valueFormatter.createDefaultFormatter(null);
        }

        this.axisFillValue = EnhancedScatterChart.getValueAxisFill(dataView);

        this.hasHighlights = dataValues.length > 0 && dataValues.some(value => value.highlights && value.highlights.some(_ => _));

        const colorHelper: ColorHelper = new ColorHelper(
            colorPalette,
            {
                objectName: "dataPoint",
                propertyName: "fill"
            },
            hasDynamicSeries
                ? undefined
                : settings.enableDataPointCardSettings.defaultColor.value.value
        );

        const dataPoints: EnhancedScatterChartDataPoint[] = this.createDataPoints(
            visualHost,
            dataValues,
            scatterMetadata,
            categories,
            categoryValues,
            categoryFormatter,
            categoryObjects,
            hasDynamicSeries,
            colorHelper,
            settings,
            this.hasHighlights
        );

        if (interactivityService) {
            interactivityService.applySelectionStateToData(dataPoints);
        }

        const legendParseResult = this.parseLegend(visualHost, dataValues, dvSource, categories, categoryIndex, colorHelper, hasDynamicSeries),
              legendDataPoints: LegendDataPoint[] = legendParseResult.legendDataPoints,
              legendTitle: string = legendParseResult.legendTitle;

        this.changeSettingsAndMetadata(dataPoints, scatterMetadata, settings, legendTitle);

        return {
            settings,
            dataPoints,
            legendDataPoints,
            hasDynamicSeries,
            useShape,
            useCustomColor,
            xCol: scatterMetadata.cols.x,
            yCol: scatterMetadata.cols.y,
            axesLabels: scatterMetadata.axesLabels,
            selectedIds: [],
            hasHighlights: this.hasHighlights
        };
    }

    private changeSettingsAndMetadata(
        dataPoints: EnhancedScatterChartDataPoint[],
        scatterMetadata: EnhancedScatterChartMeasureMetadata,
        settings: EnhancedScatterChartSettingsModel,
        legendTitle: string): void {

        settings.enableLegendCardSettings.titleText.value = settings.enableLegendCardSettings.titleText.value || legendTitle;
        if (!settings.enableCategoryAxisCardSettings.showAxisTitle.value) {
            scatterMetadata.axesLabels.x = null;
        }

        if (!settings.enableValueAxisCardSettings.showAxisTitle.value) {
            scatterMetadata.axesLabels.y = null;
        }

        if (dataPoints && dataPoints[0]) {
            const dataPoint: EnhancedScatterChartDataPoint = dataPoints[0];

            if (dataPoint.xStart != null) {
                settings.enableCategoryAxisCardSettings.start.value = dataPoint.xStart;
            }

            if (dataPoint.xEnd != null) {
                settings.enableCategoryAxisCardSettings.end.value = dataPoint.xEnd;
            }

            if (dataPoint.yStart != null) {
                settings.enableValueAxisCardSettings.start.value = dataPoint.yStart;
            }

            if (dataPoint.yEnd != null) {
                settings.enableValueAxisCardSettings.end.value = dataPoint.yEnd;
            }
        }
    }

    private parseLegend(
        visualHost: IVisualHost,
        dataValues: DataViewValueColumns,
        dvSource: DataViewMetadataColumn,
        categories: DataViewCategoryColumn[],
        categoryIndex: number,
        colorHelper: ColorHelper,
        hasDynamicSeries: boolean): { legendDataPoints: LegendDataPoint[], legendTitle: string } {
        let legendDataPoints: LegendDataPoint[] = [];

        if (hasDynamicSeries) {
            const formatString: string = valueFormatter.getFormatStringByColumn(dvSource);

            legendDataPoints = EnhancedScatterChart.createSeriesLegend(
                visualHost,
                dataValues,
                formatString,
                colorHelper,
            );
        }

        let legendTitle: string = dataValues && dvSource
            ? dvSource.displayName
            : EnhancedScatterChart.EmptyString;

        if (!legendTitle) {
            legendTitle = categories
                && categories[categoryIndex]
                && categories[categoryIndex].source
                && categories[categoryIndex].source.displayName
                ? categories[categoryIndex].source.displayName
                : EnhancedScatterChart.EmptyString;
        }

        return { legendDataPoints, legendTitle };
    }

    private isDataViewValid(dataView: DataView): boolean {

        const categories: DataViewCategoryColumn[] = dataView?.categorical?.categories?.length && dataView.categorical.categories;

        const values: DataViewValueColumns = dataView?.categorical?.values;

        if (values === undefined || values.length == 0) {
            return;
        }

        const metadata: EnhancedScatterChartMeasureMetadata = EnhancedScatterChart.getMetadata(categories, values.grouped());
        
        if (!metadata.cols.x || !metadata.cols.y) {
            return;
        }

        return !!(dataView && dataView.metadata);
    }

    private parseSettings(colorHelper: ColorHelper): EnhancedScatterChartSettingsModel {
        const settings: EnhancedScatterChartSettingsModel = this.formattingSettings;

        settings.enableDataPointCardSettings.defaultColor.value.value = colorHelper.getHighContrastColor(
            "foreground",
            settings.enableDataPointCardSettings.defaultColor.value.value,
        );

        settings.enableLegendCardSettings.labelColor.value.value = colorHelper.getHighContrastColor(
            "foreground",
            settings.enableLegendCardSettings.labelColor.value.value
        );

        settings.enableCategoryLabelsCardSettings.show.value = settings.enableCategoryLabelsCardSettings.show.value || colorHelper.isHighContrast;

        settings.enableCategoryLabelsCardSettings.color.value.value = colorHelper.getHighContrastColor(
            "foreground",
            settings.enableCategoryLabelsCardSettings.color.value.value
        );

        settings.enableFillPointCardSettings.show.value = colorHelper.isHighContrast
            ? true
            : settings.enableFillPointCardSettings.show.value;

        this.parseAxisSettings(settings.enableCategoryAxisCardSettings, colorHelper);
        this.parseAxisSettings(settings.enableValueAxisCardSettings, colorHelper);

        return settings;
    }

    private parseAxisSettings(axisSettings: ScatterChartAxisCardSettings, colorHelper: ColorHelper): void {
        axisSettings.axisColor.value.value = colorHelper.getHighContrastColor(
            "foreground",
            axisSettings.axisColor.value.value
        );

        axisSettings.zeroLineColor = colorHelper.getHighContrastColor(
            "foreground",
            axisSettings.zeroLineColor
        );

        axisSettings.lineColor = colorHelper.getHighContrastColor(
            "foreground",
            axisSettings.lineColor
        );
    }

    private static createSeriesLegend(
        visualHost: IVisualHost,
        dataValues: DataViewValueColumns,
        formatString: string,
        colorHelper: ColorHelper,
    ): LegendDataPoint[] {
        const legendItems: LegendDataPoint[] = [];

        const grouped: DataViewValueColumnGroup[] = dataValues.grouped();

        for (let i: number = 0, len: number = grouped.length; i < len; i++) {
            const grouping: DataViewValueColumnGroup = grouped[i];

            const color: string = colorHelper.getColorForSeriesValue(
                grouping.objects,
                grouping.name,
                "foreground"
            );

            const selectionId: ISelectionId = visualHost.createSelectionIdBuilder()
                .withSeries(dataValues, grouping)
                .createSelectionId();

            legendItems.push({
                color,
                label: valueFormatter.format(grouping.name, formatString),
                identity: selectionId,
                selected: EnhancedScatterChart.DefaultSelectionStateOfTheDataPoint
            });
        }

        return legendItems;
    }

    private static getMetadata(
        categories: DataViewCategoryColumn[],
        grouped: DataViewValueColumnGroup[],
    ): EnhancedScatterChartMeasureMetadata {
        const categoryIndex: number = getCategoryIndexOfRole(categories, EnhancedScatterChart.ColumnCategory),
            colorFillIndex: number = getCategoryIndexOfRole(categories, EnhancedScatterChart.ColumnColorFill),
            xIndex: number = getMeasureIndexOfRole(grouped, EnhancedScatterChart.ColumnX),
            yIndex: number = getMeasureIndexOfRole(grouped, EnhancedScatterChart.ColumnY),
            xStartIndex: number = getMeasureIndexOfRole(grouped, EnhancedScatterChart.ColumnXStart),
            xEndIndex: number = getMeasureIndexOfRole(grouped, EnhancedScatterChart.ColumnXEnd),
            yStartIndex: number = getMeasureIndexOfRole(grouped, EnhancedScatterChart.ColumnYStart),
            yEndIndex: number = getMeasureIndexOfRole(grouped, EnhancedScatterChart.ColumnYEnd);

        let xCol: DataViewMetadataColumn,
            yCol: DataViewMetadataColumn,
            xAxisLabel: string = EnhancedScatterChart.EmptyString,
            yAxisLabel: string = EnhancedScatterChart.EmptyString;

        if (grouped && grouped.length) {
            const firstGroup: DataViewValueColumnGroup = grouped[0];

            if (xIndex >= 0) {
                xCol = firstGroup.values[xIndex].source;
                xAxisLabel = firstGroup.values[xIndex].source.displayName;
            }

            if (yIndex >= 0) {
                yCol = firstGroup.values[yIndex].source;
                yAxisLabel = firstGroup.values[yIndex].source.displayName;
            }
        }

        return {
            idx: {
                category: categoryIndex,
                x: xIndex,
                y: yIndex,
                colorFill: colorFillIndex,
                xStart: xStartIndex,
                xEnd: xEndIndex,
                yStart: yStartIndex,
                yEnd: yEndIndex
            },
            cols: {
                x: xCol,
                y: yCol,
            },
            axesLabels: {
                x: xAxisLabel,
                y: yAxisLabel
            }
        };
    }

    public static createLazyFormattedCategory(formatter: IValueFormatter, value: string): () => string {
        return () => formatter.format(value);
    }

    public static displayTimestamp = (
        timestamp: number
    ): string => {
        const value = new Date(timestamp);
        return valueFormatter.format(value, "dd MMM yyyy");
    }

    public static isDateTypeColumn(
        source: DataViewMetadataColumn
    ): boolean {
        return (source && source.type && source.type.dateTime);
    }

    private calculateMeasures(
        seriesValues: DataViewValueColumn[],
        indicies: EnhancedScatterChartMeasureMetadataIndexes,
        categories: DataViewCategoryColumn[]): { [propertyName: string]: DataViewValueColumn } {
        const measureX: DataViewValueColumn = EnhancedScatterChart.getMeasureValue(
            indicies.x,
            seriesValues
        );

        const measureY: DataViewValueColumn = EnhancedScatterChart.getMeasureValue(
            indicies.y,
            seriesValues
        );

        const measureXStart: DataViewValueColumn = EnhancedScatterChart.getMeasureValue(
            indicies.xStart,
            seriesValues
        );

        const measureXEnd: DataViewValueColumn = EnhancedScatterChart.getMeasureValue(
            indicies.xEnd,
            seriesValues
        );

        const measureYStart: DataViewValueColumn = EnhancedScatterChart.getMeasureValue(
            indicies.yStart,
            seriesValues
        );

        const measureYEnd: DataViewValueColumn = EnhancedScatterChart.getMeasureValue(
            indicies.yEnd,
            seriesValues
        );

        return {
            measureX,
            measureY,
            measureXStart,
            measureXEnd,
            measureYStart,
            measureYEnd,
            measureColorFill: categories[indicies.colorFill]
        };
    }

    private changeSeriesData(
        measures: { [propertyName: string]: DataViewValueColumn },
        seriesData: tooltipBuilder.TooltipSeriesDataItem[],
        xVal: PrimitiveValue,
        yVal: PrimitiveValue,
        categoryIdx: number) {
        if (measures.measureX) {
            seriesData.push({
                value: EnhancedScatterChart.isDateTypeColumn(measures.measureX.source)
                    ? EnhancedScatterChart.displayTimestamp(<number>xVal)
                    : xVal,
                metadata: measures.measureX
            });
        }

        if (measures.measureY) {
            seriesData.push({
                value: EnhancedScatterChart.isDateTypeColumn(measures.measureY.source)
                    ? EnhancedScatterChart.displayTimestamp(<number>yVal)
                    : yVal,
                metadata: measures.measureY
            });
        }

        if (measures.measureColorFill && measures.measureColorFill.values
            && measures.measureColorFill.values.length > EnhancedScatterChart.MinAmountOfValues) {
            seriesData.push({
                value: measures.measureColorFill.values[categoryIdx],
                metadata: measures.measureColorFill
            });
        }

        if (measures.measureShape && measures.measureShape.values
            && measures.measureShape.values.length > EnhancedScatterChart.MinAmountOfValues) {

            seriesData.push({
                value: measures.measureShape.values[categoryIdx],
                metadata: measures.measureShape
            });
        }

        if (measures.measureXStart && measures.measureXStart.values
            && measures.measureXStart.values.length > EnhancedScatterChart.MinAmountOfValues) {
            seriesData.push({
                value: measures.measureXStart.values[categoryIdx],
                metadata: measures.measureXStart
            });
        }

        if (measures.measureXEnd && measures.measureXEnd.values
            && measures.measureXEnd.values.length > EnhancedScatterChart.MinAmountOfValues) {
            seriesData.push({
                value: measures.measureXEnd.values[categoryIdx],
                metadata: measures.measureXEnd
            });
        }

        if (measures.measureYStart && measures.measureYStart.values
            && measures.measureYStart.values.length > EnhancedScatterChart.MinAmountOfValues) {
            seriesData.push({
                value: measures.measureYStart.values[categoryIdx],
                metadata: measures.measureYStart
            });
        }

        if (measures.measureYEnd && measures.measureYEnd.values
            && measures.measureYEnd.values.length > EnhancedScatterChart.MinAmountOfValues) {
            seriesData.push({
                value: measures.measureYEnd.values[categoryIdx],
                metadata: measures.measureYEnd
            });
        }
    }

    private getValuesFromDataViewValueColumnById(measures, categoryIdx: number): { [property: string]: any } {

        const colorFill: string = <string>EnhancedScatterChart.getValueFromDataViewValueColumnById(measures.measureColorFill, categoryIdx);


        const xStart: number = <number>EnhancedScatterChart.getValueFromDataViewValueColumnById(measures.measureXStart, categoryIdx);
        const xEnd: number = <number>EnhancedScatterChart.getValueFromDataViewValueColumnById(measures.measureXEnd, categoryIdx);
        const yStart: number = <number>EnhancedScatterChart.getValueFromDataViewValueColumnById(measures.measureYStart, categoryIdx);
        const yEnd: number = <number>EnhancedScatterChart.getValueFromDataViewValueColumnById(measures.measureYEnd, categoryIdx);

        return {
            colorFill,
            xStart,
            xEnd,
            yStart,
            yEnd
        };
    }

    // eslint-disable-next-line max-lines-per-function
    private createDataPoints(
        visualHost: IVisualHost,
        dataValues: DataViewValueColumns,
        metadata: EnhancedScatterChartMeasureMetadata,
        categories: DataViewCategoryColumn[],
        categoryValues: any[],
        categoryFormatter: IValueFormatter,
        categoryObjects: DataViewObjects[],
        hasDynamicSeries: boolean,
        colorHelper: ColorHelper,
        settings: EnhancedScatterChartSettingsModel,
        hasHighlights: boolean = false
    ): EnhancedScatterChartDataPoint[] {
        const dataPoints: EnhancedScatterChartDataPoint[] = [];
        const indicies: EnhancedScatterChartMeasureMetadataIndexes = metadata.idx;
        const dataValueSource: DataViewMetadataColumn = dataValues.source;
        const grouped: DataViewValueColumnGroup[] = dataValues.grouped();

        for (let categoryIdx: number = 0, ilen: number = categoryValues.length; categoryIdx < ilen; categoryIdx++) {
            const categoryValue: any = categoryValues[categoryIdx];

            for (let seriesIdx: number = 0, len: number = grouped.length; seriesIdx < len; seriesIdx++) {
                const grouping: DataViewValueColumnGroup = grouped[seriesIdx];
                const seriesValues: DataViewValueColumn[] = grouping.values;
                const measures: { [propertyName: string]: DataViewValueColumn } = this.calculateMeasures(seriesValues, indicies, categories);

                // TO BE CHANGED: need to update (refactor) these lines below.
                const xVal: PrimitiveValue = EnhancedScatterChart.getDefinedNumberByCategoryId(measures.measureX, categoryIdx, metadata.cols.x.type);
                const yVal: PrimitiveValue = EnhancedScatterChart.getDefinedNumberByCategoryId(measures.measureY, categoryIdx, metadata.cols.y.type);
                const hasNullValue: boolean = (xVal == null) || (yVal == null);

                if (hasNullValue) {
                    continue;
                }

                const { colorFill, xStart, xEnd, yStart, yEnd } =
                    this.getValuesFromDataViewValueColumnById(measures, categoryIdx);
                const parsedColorFill: string = colorFill
                    ? colorHelper.getHighContrastColor("foreground", d3Rgb(colorFill).toString())
                    : undefined;

                let color: string;
                if (hasDynamicSeries) {
                    color = colorHelper.getColorForSeriesValue(grouping.objects, grouping.name, "foreground");
                } else {
                    // If we have no Size measure then use a blank query name
                    const measureSource: string = measures.measureSize != null
                        ? measures.measureSize.source.queryName
                        : EnhancedScatterChart.EmptyString;

                    color = colorHelper.getColorForMeasure(categoryObjects && categoryObjects[categoryIdx], measureSource, "foreground");
                }

                const category: DataViewCategoryColumn = categories && categories.length > EnhancedScatterChart.MinAmountOfCategories
                    ? categories[indicies.category]
                    : null;
                const identity: ISelectionId = visualHost.createSelectionIdBuilder()
                    .withCategory(category, categoryIdx)
                    .withSeries(dataValues, grouping)
                    .createSelectionId();

                // TO BE CHANGED: need to refactor these lines below.
                const seriesData: tooltipBuilder.TooltipSeriesDataItem[] = [];
                if (dataValueSource) {
                    // Dynamic series
                    seriesData.push({
                        value: grouping.name,
                        metadata: {
                            source: dataValueSource,
                            values: []
                        }
                    });
                }

                this.changeSeriesData(measures, seriesData, xVal, yVal, categoryIdx);

                const tooltipInfo: VisualTooltipDataItem[] = tooltipBuilder.createTooltipInfo(
                    categoryValue,
                    category ? [category] : undefined,
                    seriesData
                );
                const currentFill: string = parsedColorFill || color;

                /*
                    If the fill color is dark, we need to make the stroke lighter or if light, then vice versa.
                    d3Hsl(currentFill).l returns the lightness of the color in the range [0, 1].

                    darker and brighter functions take number argument for intensiveness of color change
                */

                let stroke: string = d3Rgb(currentFill).darker().toString();

                switch(true) {
                    case d3Hsl(currentFill).l == 0: {
                        const whiteColor: string = "#ffffff";
                        stroke = d3Rgb(whiteColor).darker().toString();
                        break;
                    }

                    case d3Hsl(currentFill).l < 0.26: {
                        stroke = d3Rgb(currentFill).brighter(3).toString();
                        break;
                    }

                    case d3Hsl(currentFill).l < 0.36: {
                        stroke = d3Rgb(currentFill).brighter().toString();
                        break;
                    }

                    case d3Hsl(currentFill).l > 0.7: {
                        stroke = d3Rgb(currentFill).darker(3).toString();
                        break;
                    }

                    case d3Hsl(currentFill).l >= 0.5: {
                        stroke = d3Rgb(currentFill).darker().toString();
                        break;
                    }
                }

                const fillEnabled = settings.enableFillPointCardSettings.show.value && !this.data?.useShape;
                const outlineEnabled = settings.enableOutlineCardSettings.show.value;
                const outlineWidth = settings.enableOutlineCardSettings.strokeWidth.value;
        
                const fill: string = fillEnabled ? currentFill : null;
                let strokeWidth: number = outlineEnabled ? outlineWidth : 0;
                stroke = !fillEnabled && !outlineEnabled ? currentFill : stroke;
        
                if (!fill && !outlineEnabled) {
                    strokeWidth = 1;
                }


                let highlight: number = null;                

                if (hasHighlights) {
                    const notNullIndex = seriesValues.findIndex(value => value.highlights && value.values[categoryIdx] != null);
                    if (notNullIndex != -1) highlight = <number>seriesValues[notNullIndex].highlights[categoryIdx];
                }

                dataPoints.push({
                    xStart,
                    xEnd,
                    fill,
                    stroke,
                    yStart,
                    yEnd,
                    identity,
                    tooltipInfo,
                    x: xVal,
                    y: yVal,
                    radius: { sizeMeasure: null, index: 0 },
                    strokeWidth: strokeWidth,
                    formattedCategory: EnhancedScatterChart.createLazyFormattedCategory(categoryFormatter, categoryValue),
                    selected: EnhancedScatterChart.DefaultSelectionStateOfTheDataPoint,
                    contentPosition: EnhancedScatterChart.DefaultContentPosition,
                    highlight: hasHighlights && !!highlight,
                });
            }
        }

        return dataPoints;
    }

    private static getMeasureValue(
        measureIndex: number,
        seriesValues: DataViewValueColumn[]
    ): DataViewValueColumn {
        if (seriesValues && measureIndex >= EnhancedScatterChart.MinIndex) {
            return seriesValues[measureIndex];
        }

        return null;
    }

    private static getNumberFromDataViewValueColumnById(
        dataViewValueColumn: DataViewCategoryColumn | DataViewValueColumn,
        index: number
    ): number {
        const value: number = <number>EnhancedScatterChart.getValueFromDataViewValueColumnById(
            dataViewValueColumn,
            index
        );

        return value && !isNaN(value)
            ? value
            : EnhancedScatterChart.DefaultColumnId;
    }

    private static getValueFromDataViewValueColumnById(
        dataViewValueColumn: DataViewCategoryColumn | DataViewValueColumn,
        index: number
    ): powerbi.PrimitiveValue {

        return dataViewValueColumn && dataViewValueColumn.values
            ? dataViewValueColumn.values[index]
            : null;
    }

    private getDefaultData(settings?: EnhancedScatterChartSettingsModel): EnhancedScatterChartData {
        return {
            settings,
            xCol: undefined,
            yCol: undefined,
            dataPoints: [],
            legendDataPoints: [],
            axesLabels: {
                x: EnhancedScatterChart.EmptyString,
                y: EnhancedScatterChart.EmptyString
            },
            selectedIds: [],
            hasDynamicSeries: false,
            useShape: false,
            useCustomColor: false,
            hasHighlights: false
        };
    }

    public update(options: VisualUpdateOptions) {
        
        const dataView: DataView = options
            && options.dataViews
            && options.dataViews[0];

        this.viewport = options && options.viewport
            ? { ...options.viewport }
            : { width: 0, height: 0 };

        this.data = this.parseData(
            dataView,
            this.colorPalette,
            this.visualHost,
            this.interactivityService,
        );

        this.eventService.renderingStarted(options);

        this.renderLegend();

        this.render();

        this.eventService.renderingFinished(options);

    }

    private renderLegend(): void {
        const legendSettings: EnableLegendCardSettings  = this.formattingSettings.enableLegendCardSettings;

        const legendDataPoints = this.data.legendDataPoints;

        const isLegendShown: boolean = legendSettings.show.value
            && legendDataPoints.length > EnhancedScatterChart.MinAmountOfDataPointsInTheLegend;

        const legendData: LegendData = {
            title: legendSettings.showTitle.value
                ? legendSettings.titleText.value
                : undefined,
            dataPoints: isLegendShown
                ? legendDataPoints
                : [],
            fontSize: legendSettings.fontSize.value,
            labelColor: legendSettings.labelColor.value.value,
        };

        const legend: ILegend = this.legend;

        legend.changeOrientation(LegendPosition[this.formattingSettings.enableLegendCardSettings.positionDropDown.value.value]);

        legend.drawLegend(legendData, {
            height: this.viewport.height,
            width: this.viewport.width
        });

        legendModule.positionChartArea(this.svg, legend);
    }

    private shouldRenderAxis(
        axisProperties: IAxisProperties,
        axisSettings: ScatterChartAxisCardSettings
    ): boolean {
        return !!(axisSettings
            && axisSettings.show.value
            && axisProperties
            && axisProperties.values
            && axisProperties.values.length > EnhancedScatterChart.MinAmountOfValues
        );
    }

    private initMargins() {
        const maxMarginFactor: number = EnhancedScatterChart.MaxMarginFactor;

        this.leftRightMarginLimit = this.viewport.width * maxMarginFactor;

        this.bottomMarginLimit = Math.max(
            EnhancedScatterChart.DefaultMargin.bottom,
            Math.ceil(this.viewport.height * maxMarginFactor)
        );

        // reset defaults
        this.margin.top = EnhancedScatterChart.DefaultMargin.top;
        this.margin.bottom = this.bottomMarginLimit;
        this.margin.right = EnhancedScatterChart.DefaultMargin.right;
    }

    public render(): void {
        this.viewport.height -= this.legendViewport.height;
        this.viewport.width -= this.legendViewport.width;

        if (this.viewportIn.width === EnhancedScatterChart.MinViewport.width
            || this.viewportIn.height === EnhancedScatterChart.MinViewport.height
        ) {
            return;
        }

        this.initMargins();
        this.calculateAxes(
            this.data.settings.enableCategoryAxisCardSettings,
            this.data.settings.enableValueAxisCardSettings,
            EnhancedScatterChart.TextProperties,
            true
        );

        const renderXAxis: boolean = this.shouldRenderAxis(this.xAxisProperties, this.data.settings.enableCategoryAxisCardSettings);
        const renderY1Axis: boolean = this.shouldRenderAxis(this.yAxisProperties, this.data.settings.enableValueAxisCardSettings);

        this.isXScrollBarVisible = EnhancedScatterChart.isScrollbarVisible;
        this.isYScrollBarVisible = EnhancedScatterChart.isScrollbarVisible;

        this.calculateAxes(this.data.settings.enableCategoryAxisCardSettings, this.data.settings.enableValueAxisCardSettings, EnhancedScatterChart.TextProperties);

        let tickLabelMargins: TickLabelMargins;
        let axisLabels: ChartAxesLabels;
        let chartHasAxisLabels: boolean;
        const showY1OnRight: boolean = this.yAxisOrientation === yAxisPosition.right;
        let changedLabelsResult = this.changeLabelMargins(
            EnhancedScatterChart.DefaultValueOfDoneWithMargins,
            tickLabelMargins,
            axisLabels,
            EnhancedScatterChart.DefaultNumIterations,
            EnhancedScatterChart.MaxIterations,
            showY1OnRight,
            renderXAxis,
            renderY1Axis,
            chartHasAxisLabels,
            true);

        this.renderChart(
            this.xAxisProperties,
            this.data.settings.enableCategoryAxisCardSettings,
            this.yAxisProperties,
            this.data.settings.enableValueAxisCardSettings,
            changedLabelsResult.tickLabelMargins,
            changedLabelsResult.chartHasAxisLabels,
            changedLabelsResult.axisLabels
        );

        this.updateAxis();

        if (!this.data) {
            return;
        }

        this.mainGraphicsSVGSelection
            .attr("width", this.viewportIn.width)
            .attr("height", this.viewportIn.height);

        const sortedData: EnhancedScatterChartDataPoint[] = this.data.dataPoints;

        const scatterMarkers: Selection<EnhancedScatterChartDataPoint> = this.drawScatterMarkers(
            sortedData,
            EnhancedScatterChart.AnimationDuration
        );

        this.drawCategoryLabels();
        this.bindTooltip(scatterMarkers);

        this.bindInteractivityService(scatterMarkers, this.data.dataPoints);
    }

    private drawCategoryLabels() {
        const dataPoints: EnhancedScatterChartDataPoint[] = this.data.dataPoints;
        if (this.data.settings.enableCategoryLabelsCardSettings.show.value) {
            const layout: ILabelLayout = this.getLabelLayout(this.data.settings.enableCategoryLabelsCardSettings, this.viewportIn);
            const clonedDataPoints: EnhancedScatterChartDataPoint[] = this.cloneDataPoints(dataPoints);

            // fix bug 3863: drawDefaultLabelsForDataPointChart add to datapoints[xxx].size = object, which causes when
            // category labels is on and Fill Points option off to fill the points when mouse click occures because of default size
            // is set to datapoints.
            const labels: Selection<EnhancedScatterChartDataPoint> = dataLabelUtils.drawDefaultLabelsForDataPointChart(
                clonedDataPoints,
                this.mainGraphicsG,
                layout,
                this.viewportIn
            );

            if (labels) {
                labels.attr("transform", () => {
                    // Use the default bubble radius for offset
                    const dx = EnhancedScatterChart.BubbleRadius + 14;
                    const dy = (EnhancedScatterChart.BubbleRadius) / EnhancedScatterChart.DataLabelYOffset;
                    return manipulation.translate(dx, dy);
                });
            }
        }
        else {
            dataLabelUtils.cleanDataLabels(this.mainGraphicsG);
        }
    }


    private changeLabelMargins(
        doneWithMargins: boolean,
        tickLabelMargins: TickLabelMargins,
        axisLabels: ChartAxesLabels,
        numIterations: number,
        maxIterations: number,
        showY1OnRight: boolean,
        renderXAxis: boolean,
        renderY1Axis: boolean,
        chartHasAxisLabels: boolean,
        changeYAxisSide: boolean = false
    ): { tickLabelMargins: TickLabelMargins, axisLabels: ChartAxesLabels, chartHasAxisLabels: boolean } {
        while (!doneWithMargins && numIterations < maxIterations) {
            numIterations++;

            tickLabelMargins = axis.getTickLabelMargins(
                {
                    width: this.viewportIn.width,
                    height: this.viewport.height
                },
                this.leftRightMarginLimit,
                measureSvgTextWidth,
                measureSvgTextHeight,
                {
                    x: this.xAxisProperties,
                    y1: this.yAxisProperties
                },
                this.bottomMarginLimit,
                EnhancedScatterChart.TextProperties,
                this.isXScrollBarVisible || this.isYScrollBarVisible,
                showY1OnRight,
                renderXAxis,
                renderY1Axis,
                false);

            // We look at the y axes as main and second sides, if the y axis orientation is right so the main side represents the right side
            let maxMainYaxisSide: number = showY1OnRight
                ? tickLabelMargins.yRight
                : tickLabelMargins.yLeft;

            let maxSecondYaxisSide: number = showY1OnRight
                ? tickLabelMargins.yLeft
                : tickLabelMargins.yRight;

            let xMax = tickLabelMargins.xMax;

            maxMainYaxisSide += EnhancedScatterChart.AxisSide;

            if (changeYAxisSide) {
                maxSecondYaxisSide += EnhancedScatterChart.AxisSide;
            }

            if (showY1OnRight && renderY1Axis) {
                maxSecondYaxisSide += EnhancedScatterChart.SecondYAxisSide;
            }

            if (changeYAxisSide && !showY1OnRight && renderY1Axis) {
                maxMainYaxisSide += EnhancedScatterChart.SecondAxisSide;
            }

            xMax += EnhancedScatterChart.XMaxOffset;

            axisLabels = {
                x: this.xAxisProperties.axisLabel,
                y: this.yAxisProperties.axisLabel,
                y2: null
            };

            chartHasAxisLabels = (axisLabels.x != null) || (axisLabels.y != null || axisLabels.y2 != null);

            if (axisLabels.x != null) {
                xMax += EnhancedScatterChart.AdditionalXMaxOffset;
            }

            if (axisLabels.y != null) {
                maxMainYaxisSide += EnhancedScatterChart.SecondAxisSide;
            }

            if (axisLabels.y2 != null) {
                maxSecondYaxisSide += EnhancedScatterChart.SecondAxisSide;
            }

            this.margin.left = showY1OnRight
                ? maxSecondYaxisSide
                : maxMainYaxisSide;

            this.margin.right = showY1OnRight
                ? maxMainYaxisSide
                : maxSecondYaxisSide;

            this.margin.bottom = xMax;

            this.calculateAxes(
                this.data.settings.enableCategoryAxisCardSettings,
                this.data.settings.enableValueAxisCardSettings,
                EnhancedScatterChart.TextProperties
            );

            // the minor padding adjustments could have affected the chosen tick values, which would then need to calculate margins again
            // e.g. [0,2,4,6,8] vs. [0,5,10] the 10 is wider and needs more margin.
            if (this.yAxisProperties.values.length === this.yAxisProperties.values.length) {
                doneWithMargins = !EnhancedScatterChart.DefaultValueOfDoneWithMargins;
            }
        }

        return { tickLabelMargins, axisLabels, chartHasAxisLabels };
    }

    private bindTooltip(selection: Selection<TooltipEnabledDataPoint>): void {
        this.tooltipServiceWrapper.addTooltip(
            selection,
            (tooltipEvent: TooltipEnabledDataPoint) => tooltipEvent.tooltipInfo);
    }

    private bindInteractivityService(
        dataPointsSelection: Selection<EnhancedScatterChartDataPoint>,
        dataPoints: EnhancedScatterChartDataPoint[]
    ): void {
        if (!this.behavior || !this.interactivityService) {
            return;
        }

        const behaviorOptions: BehaviorOptions = {
            dataPointsSelection,
            clearCatcher: this.clearCatcher,
            interactivityService: this.interactivityService,
            behavior: this.behavior,
            dataPoints
        };

        this.interactivityService.bind(behaviorOptions);

        this.behavior.renderSelection(this.hasHighlights);
    }

    private cloneDataPoints(dataPoints: EnhancedScatterChartDataPoint[]): EnhancedScatterChartDataPoint[] {
        return dataPoints.map((dataPoint: EnhancedScatterChartDataPoint) => {
            return lodashClone(dataPoint);
        });
    }

    private getLabelLayout(
        labelSettings: EnableCategoryLabelsCardSettings,
        viewport: IViewport,
    ): ILabelLayout {
        const xScale: any = this.xAxisProperties.scale;
        const yScale: any = this.yAxisProperties.scale;
        const fontSizeInPx: string = PixelConverter.fromPoint(labelSettings.fontSize.value);

        return {
            labelText: (dataPoint: EnhancedScatterChartDataPoint) => {
                return getLabelFormattedText({
                    label: dataPoint.formattedCategory(),
                    fontSize: labelSettings.fontSize.value,
                    maxWidth: viewport.width,
                });
            },
            labelLayout: {
                x: (dataPoint: EnhancedScatterChartDataPoint) => {
                    return EnhancedScatterChart.getDefinedNumberValue(xScale(dataPoint.x));
                },
                y: (dataPoint: EnhancedScatterChartDataPoint) => {
                    const margin: number = EnhancedScatterChart.getBubbleRadius(dataPoint.radius, viewport)
                        + EnhancedScatterChart.LabelMargin;

                    return yScale(dataPoint.y) - margin;
                },
            },
            filter: (dataPoint: EnhancedScatterChartDataPoint) => {
                return dataPoint != null && dataPoint.formattedCategory() != null;
            },
            style: {
                "fill": labelSettings.color.value.value,
                "font-size": fontSizeInPx,
                "font-family": LabelTextProperties.fontFamily,
            },
        };
    }

    private static getBubbleRadius(
        radiusData: EnhancedScatterChartRadiusData,
        viewport: IViewport
    ): number {
        return EnhancedScatterChart.BubbleRadius; // Always use default
    }

    private static getBubblePixelAreaSizeRange(
        viewPort: IViewport,
        minSizeRange: number,
        maxSizeRange: number
    ): EnhancedScatterDataRange {

        let ratio: number = EnhancedScatterChart.DefaultBubbleRatio;

        if (viewPort.height > EnhancedScatterChart.MinViewport.height
            && viewPort.width > EnhancedScatterChart.MinViewport.width) {

            const minSize: number = Math.min(viewPort.height, viewPort.width);

            ratio = (minSize * minSize) / EnhancedScatterChart.AreaOf300By300Chart;
        }

        const minRange: number = Math.round(minSizeRange * ratio),
            maxRange: number = Math.round(maxSizeRange * ratio);

        return {
            minRange: minRange,
            maxRange: maxRange,
            delta: maxRange - minRange
        };
    }

    public static projectSizeToPixels(
        size: number,
        actualSizeDataRange: EnhancedScatterDataRange,
        bubblePixelAreaSizeRange: EnhancedScatterDataRange
    ): number {

        let projectedSize: number = EnhancedScatterChart.DefaultProjectedSize;

        if (actualSizeDataRange) {
            // Project value on the required range of bubble area sizes
            projectedSize = bubblePixelAreaSizeRange.maxRange;

            if (actualSizeDataRange.delta !== EnhancedScatterChart.MinDelta) {
                const value: number = Math.min(
                    Math.max(size, actualSizeDataRange.minRange),
                    actualSizeDataRange.maxRange);

                projectedSize = EnhancedScatterChart.PROJECT(
                    value,
                    actualSizeDataRange,
                    bubblePixelAreaSizeRange);
            }

            projectedSize = Math.sqrt(projectedSize / Math.PI)
                * EnhancedScatterChart.ProjectedSizeFactor;
        }

        return Math.round(projectedSize);
    }

    public static PROJECT(
        value: number,
        actualSizeDataRange: EnhancedScatterDataRange,
        bubblePixelAreaSizeRange: EnhancedScatterDataRange
    ): number {

        if (actualSizeDataRange.delta === EnhancedScatterChart.MinDelta
            || bubblePixelAreaSizeRange.delta === EnhancedScatterChart.MinDelta) {

            return (EnhancedScatterChart.rangeContains(actualSizeDataRange, value))
                ? bubblePixelAreaSizeRange.minRange
                : null;
        }

        const relativeX: number = (value - actualSizeDataRange.minRange) / actualSizeDataRange.delta;

        return bubblePixelAreaSizeRange.minRange
            + relativeX * bubblePixelAreaSizeRange.delta;
    }

    public static rangeContains(range: EnhancedScatterDataRange, value: number): boolean {
        return range.minRange <= value && value <= range.maxRange;
    }

    private static getValueAxisFill(dataView: DataView): Fill {
        const valueAxis: DataViewObject = dataView.metadata?.objects?.["valueAxis"];
        if (valueAxis) {
            return <Fill>valueAxis["axisColor"];
        }

        return { solid: { color: EnhancedScatterChart.DefaultCategoryAxisFillColor } };
    }

    /**
     * Public for testability.
     */
    public addElementToDOM(
        rootElement: Selection<any>,
        properties: ElementProperties
    ): Selection<any> {

        if (!rootElement || !properties) {
            return null;
        }

        const elementSelection: Selection<any> = rootElement.selectAll(properties.selector),
                elementUpdateSelection: Selection<any> = elementSelection.data(properties.data || [[]]);

        const elementUpdateSelectionMerged = elementUpdateSelection
            .enter()
            .append(properties.name)
            .merge(elementUpdateSelection);

        const propertiesAttributes: string[] = properties.attributes ? Object.keys(properties.attributes) : [];
        for (const propKey of propertiesAttributes) {
            elementUpdateSelectionMerged.attr(propKey, properties.attributes[propKey]);
        }

        const propertiesStyles = properties.styles ? Object.keys(properties.styles) : [];
        for (const propKey of propertiesStyles) {
            elementUpdateSelectionMerged.attr(propKey, properties.styles[propKey]);
        }

        elementUpdateSelectionMerged
            .classed(properties.className, true);

        elementUpdateSelection
            .exit()
            .remove();

        return elementUpdateSelectionMerged;
    }

    private renderXAxis(
        xAxis: IAxisProperties,
        xAxisSettings: ScatterChartAxisCardSettings,
        tickLabelMargins: any,
        duration: number): void {
        // hide show x-axis heres
        if (this.shouldRenderAxis(xAxis, xAxisSettings)) {
            const axisProperties = xAxis;
            const scale: any = axisProperties.scale;
            const ticksCount: number = axisProperties.values.length;
            const format: any = (domainValue: d3AxisDomain, value: any) => axisProperties.values[value];

            const newAxis = d3AxisBottom(scale);
            xAxis.axis = newAxis;
            this.xAxisGraphicsContext.call(newAxis.tickArguments([ticksCount]).tickFormat(format));

            xAxis.axis
                .tickSize(-this.viewportIn.height);

            if (!xAxis.willLabelsFit) {
                xAxis.axis.tickPadding(EnhancedScatterChart.DefaultAxisXTickPadding);
            }

            if (duration) {
                this.xAxisGraphicsContext
                    .transition()
                    .duration(duration)
                    .call(xAxis.axis);
            }
            else {
                this.xAxisGraphicsContext.call(xAxis.axis);
            }

            const xAxisTextNodes: Selection<any> = this.xAxisGraphicsContext.selectAll("text");
            if (xAxis.willLabelsWordBreak) {
                xAxisTextNodes.call(
                    axis.LabelLayoutStrategy.wordBreak,
                    xAxis,
                    this.bottomMarginLimit
                );
            } else {
                xAxisTextNodes.call(
                    axis.LabelLayoutStrategy.rotate,
                    this.bottomMarginLimit,
                    getTailoredTextOrDefault,
                    EnhancedScatterChart.TextProperties,
                    !xAxis.willLabelsFit,
                    this.bottomMarginLimit === tickLabelMargins.xMax,
                    xAxis,
                    this.margin,
                    this.isXScrollBarVisible || this.isYScrollBarVisible
                );
            }
            this.applyAxisColor(this.xAxisGraphicsContext, xAxisSettings);
        }
        else {
            this.xAxisGraphicsContext
                .selectAll("*")
                .remove();
        }
    }

    private renderYAxis(
        yAxis: IAxisProperties,
        yAxisSettings: ScatterChartAxisCardSettings,
        tickLabelMargins: any,
        duration: number
    ): void {
        if (this.shouldRenderAxis(yAxis, yAxisSettings)) {
            const scale: any = yAxis.scale;
            const ticksCount: number = yAxis.values.length;
            const format: any = (domainValue: d3AxisDomain, value: any) => yAxis.values[value];

            const newAxis = this.yAxisOrientation == yAxisPosition.left ? d3AxisLeft(scale) : d3AxisRight(scale);
            yAxis.axis = newAxis;
            this.yAxisGraphicsContext.call(newAxis.tickArguments([ticksCount]).tickFormat(format));

            yAxis.axis
                .tickSize(-this.viewportIn.width)
                .tickPadding(EnhancedScatterChart.DefaultAxisYTickPadding);

            if (duration) {
                this.yAxisGraphicsContext
                    .transition()
                    .duration(duration)
                    .call(yAxis.axis);
            }
            else {
                this.yAxisGraphicsContext.call(yAxis.axis);
            }

            this.applyAxisColor(this.yAxisGraphicsContext, yAxisSettings);

            if (tickLabelMargins.yLeft >= this.leftRightMarginLimit) {
                this.yAxisGraphicsContext
                    .selectAll("text")
                    .call(axis.LabelLayoutStrategy.clip,
                        // Can't use padding space to render text, so subtract that from available space for ellipses calculations
                        this.leftRightMarginLimit - EnhancedScatterChart.AxisSide,
                        svgEllipsis
                    );
            }

            // TO BE CHANGED: clip (svgEllipsis) the Y2 labels
        }
        else {
            this.yAxisGraphicsContext
                .selectAll("*")
                .remove();
        }
    }

    private renderChart(
        xAxis: IAxisProperties,
        xAxisSettings: ScatterChartAxisCardSettings,
        yAxis: IAxisProperties,
        yAxisSettings: ScatterChartAxisCardSettings,
        tickLabelMargins: any,
        chartHasAxisLabels: boolean,
        axisLabels: ChartAxesLabels
    ): void {
        const duration = EnhancedScatterChart.AnimationDuration;

        this.renderXAxis(xAxis, xAxisSettings, tickLabelMargins, duration);
        this.renderYAxis(yAxis, yAxisSettings, tickLabelMargins, duration);

        // Axis labels
        // TO BE CHANGED: Add label for second Y axis for combo chart
        if (chartHasAxisLabels) {
            const hideXAxisTitle: boolean = !(this.shouldRenderAxis(xAxis, xAxisSettings) && xAxisSettings.showAxisTitle.value);
            const hideYAxisTitle: boolean = !(this.shouldRenderAxis(yAxis, yAxisSettings) && yAxisSettings.showAxisTitle.value);

            this.renderAxesLabels(
                axisLabels,
                this.legendViewport.height,
                hideXAxisTitle,
                hideYAxisTitle,
                true,
                xAxisSettings,
                yAxisSettings
            );
        }
        else {
            this.removeAxisLabels();
        }
    }

    private applyAxisColor(selection: Selection<any>, axisSettings: ScatterChartAxisCardSettings): void {
        selection
            .selectAll("line")
            .style("stroke", axisSettings.lineColor)
            .style("stroke-width", null);

        selection
            .selectAll("path")
            .style("stroke", axisSettings.lineColor);

        selection
            .selectAll("text")
            .style("fill", axisSettings.axisColor.value.value);

        const xZeroTick: Selection<any> = selection
            .selectAll(`g${EnhancedScatterChart.TickSelector.selectorName}`)
            .filter((data) => data === EnhancedScatterChart.EmptyDataValue);

        if (xZeroTick) {
            const xZeroColor: Fill = this.axisFillValue;

            if (xZeroColor) {
                xZeroTick
                    .selectAll("line")
                    .style("stroke", axisSettings.zeroLineColor)
                    .style("stroke-width", PixelConverter.toString(axisSettings.zeroLineStrokeWidth));
            }
        }

    }

    private removeAxisLabels(): void {
        this.axisGraphicsContext
            .selectAll(EnhancedScatterChart.XAxisLabelSelector.selectorName)
            .remove();

        this.axisGraphicsContext
            .selectAll(EnhancedScatterChart.YAxisLabelSelector.selectorName)
            .remove();
    }

    /**
     * We have to optimize this function as soon as we have time for it.
     * There's a small memory leak by removing node from the DOM every time after calling of the update method.
     */
    private renderAxesLabels(
        axisLabels: ChartAxesLabels,
        legendMargin: number,
        hideXAxisTitle: boolean,
        hideYAxisTitle: boolean,
        hideY2AxisTitle: boolean,
        xAxisSettings: ScatterChartAxisCardSettings,
        yAxisSettings: ScatterChartAxisCardSettings
    ): void {

        this.removeAxisLabels();

        const margin: IMargin = this.margin,
            width: number = this.viewportIn.width,
            height: number = this.viewport.height,
            fontSize: number = EnhancedScatterChart.AxisFontSize,
            yAxisOrientation: string = this.yAxisOrientation,
            showY1OnRight: boolean = yAxisOrientation === yAxisPosition.right;

        if (!hideXAxisTitle) {
            const xAxisLabel: Selection<any> = this.axisGraphicsContext
                .append("text")
                .style("text-anchor", EnhancedScatterChart.TextAnchor)
                .style("fill", xAxisSettings.axisColor.value.value)
                .text(axisLabels.x)
                .call((text: Selection<any>) => {
                    text.each(function () {
                        const textSelection: Selection<any> = d3Select(this);

                        textSelection
                            .attr("class", EnhancedScatterChart.XAxisLabelSelector.className)
                            .attr("transform", manipulation.translate(
                                width / EnhancedScatterChart.AxisLabelOffset,
                                height - fontSize - EnhancedScatterChart.AxisLabelOffset
                            ),
                            );
                    });
                });

            xAxisLabel.call(
                axis.LabelLayoutStrategy.clip,
                width,
                svgEllipsis
            );
        }

        if (!hideYAxisTitle) {
            const yAxisLabel: Selection<any> = this.axisGraphicsContext
                .append("text")
                .style("text-anchor", EnhancedScatterChart.TextAnchor)
                .style("fill", yAxisSettings.axisColor.value.value)
                .text(axisLabels.y)
                .call((text: Selection<any>) => {
                    text.each(function () {
                        const text: Selection<any> = d3Select(this);

                        text.attr("class", EnhancedScatterChart.YAxisLabelSelector.className)
                            .attr("transform", EnhancedScatterChart.YAxisLabelTransformRotate)
                            .attr("y", showY1OnRight ? width + margin.right - fontSize : -margin.left)
                            .attr("x", -((height - margin.top - legendMargin) / EnhancedScatterChart.AxisLabelOffset))
                            .attr("dy", EnhancedScatterChart.DefaultDY);
                    });

                });
            yAxisLabel.call(
                axis.LabelLayoutStrategy.clip,
                height - (margin.bottom + margin.top),
                svgEllipsis
            );
        }

        if (!hideY2AxisTitle && axisLabels.y2) {
            const y2AxisLabel: Selection<any> = this.axisGraphicsContext
                .append("text")
                .style("text-anchor", EnhancedScatterChart.TextAnchor)
                .text(axisLabels.y2)
                .call((text: Selection<any>) => {
                    text.each(function () {
                        const text: Selection<any> = d3Select(this);

                        text.attr("class", EnhancedScatterChart.YAxisLabelSelector.className)
                            .attr("transform", EnhancedScatterChart.YAxisLabelTransformRotate)
                            .attr("y", showY1OnRight ? -margin.left : width + margin.right - fontSize)
                            .attr("x", -((height - margin.top - legendMargin) / EnhancedScatterChart.AxisLabelOffset))
                            .attr("dy", EnhancedScatterChart.DefaultDY);
                    });
                });

            y2AxisLabel.call(
                axis.LabelLayoutStrategy.clip,
                height - (margin.bottom + margin.top),
                svgEllipsis);
        }
    }

    private updateAxis(): void {
        this.adjustMargins();

        const yAxisOrientation: string = this.yAxisOrientation,
            showY1OnRight: boolean = yAxisOrientation === yAxisPosition.right;

        this.xAxisGraphicsContext.attr(
            "transform",
            manipulation.translate(
                EnhancedScatterChart.DefaultAxisOffset,
                this.viewportIn.height));

        this.yAxisGraphicsContext.attr(
            "transform",
            manipulation.translate(
                showY1OnRight
                    ? this.viewportIn.width
                    : EnhancedScatterChart.DefaultAxisOffset,
                EnhancedScatterChart.DefaultAxisOffset));

        this.svg.attr("width", this.viewport.width)
            .attr("height", this.viewport.height);

        this.svgScrollable.attr("width", this.viewport.width)
            .attr("height", this.viewport.height);

        this.svgScrollable.attr("x", EnhancedScatterChart.DefaultAxisOffset);

        const left: number = this.margin.left,
            top: number = this.margin.top;

        this.axisGraphicsContext.attr("transform", manipulation.translate(left, top));
        this.axisGraphicsContextScrollable.attr("transform", manipulation.translate(left, top));
        this.clearCatcher.attr("transform", manipulation.translate(-left, -top));

        if (this.isXScrollBarVisible) {
            this.svgScrollable.attr("x", left)
                .attr("width", this.viewportIn.width);

            this.axisGraphicsContextScrollable.attr("transform", manipulation.translate(0, top));

            this.svg.attr("width", this.viewport.width)
                .attr("height", this.viewport.height + this.ScrollBarWidth);
        }
        else if (this.isYScrollBarVisible) {
            this.svgScrollable.attr("height", this.viewportIn.height + top);

            this.svg.attr("width", this.viewport.width + this.ScrollBarWidth)
                .attr("height", this.viewport.height);
        }
    }

    private drawScatterMarkersWithoutShapes(
        markers: Selection<EnhancedScatterChartDataPoint>,
        markersMerged: Selection<EnhancedScatterChartDataPoint>,
        scatterData: EnhancedScatterChartDataPoint[],
        duration: number
    ): {
            markers: Selection<EnhancedScatterChartDataPoint>,
            markersMerged: Selection<EnhancedScatterChartDataPoint>
        } {
        this.mainGraphicsContext
            .selectAll(EnhancedScatterChart.ImageSelector.selectorName)
            .remove();

        markers = this.mainGraphicsContext
            .classed(EnhancedScatterChart.ScatterMarkersSelector.className, true)
            .selectAll(EnhancedScatterChart.DotSelector.selectorName)
            .data(scatterData, (dataPoint: EnhancedScatterChartDataPoint) => {
                return (<ISelectionId>dataPoint.identity).getKey();
            });

        markersMerged = markers
            .enter()
            .append("path")
            .merge(markers);

        markersMerged
            .classed(EnhancedScatterChart.DotSelector.className, true)
            .attr("id", EnhancedScatterChart.MarkerShapeSelector.className);

        markersMerged
            .style("stroke-width", (dataPoint: EnhancedScatterChartDataPoint) => PixelConverter.toString(dataPoint.strokeWidth))
            .style("stroke", (dataPoint: EnhancedScatterChartDataPoint) => dataPoint.stroke)
            .style("fill", (dataPoint: EnhancedScatterChartDataPoint) => dataPoint.fill)
            .attr("d", (dataPoint: EnhancedScatterChartDataPoint) => {
                const r = EnhancedScatterChart.BubbleRadius;
                return d3Symbol().type(d3SymbolCircle).size(Math.PI * r * r)();
            })
            .attr("tabindex", 0)
            .attr("focusable", true)
            .transition()
            .duration((dataPoint: EnhancedScatterChartDataPoint) => {
                if (this.keyArray.indexOf((<ISelectionId>dataPoint.identity).getKey()) >= 0) {
                    return duration;
                } else {
                    return EnhancedScatterChart.MinAnimationDuration;
                }
            })
            .attr("transform", (dataPoint: EnhancedScatterChartDataPoint) => {
                const x: number = EnhancedScatterChart.getDefinedNumberValue(this.xAxisProperties.scale(dataPoint.x)),
                    y: number = EnhancedScatterChart.getDefinedNumberValue(this.yAxisProperties.scale(dataPoint.y));

                return `translate(${x},${y})`;
            });

        return { markers, markersMerged };
    }

    private drawScatterMarkers(
        scatterData: EnhancedScatterChartDataPoint[],
        duration: number
    ): Selection<EnhancedScatterChartDataPoint> {


        let markers: Selection<EnhancedScatterChartDataPoint>,
            markersMerged: Selection<EnhancedScatterChartDataPoint>;

        const markersChanged = this.drawScatterMarkersWithoutShapes(markers, markersMerged, scatterData, duration);

        const newMarkers: Selection<EnhancedScatterChartDataPoint> = markersChanged.markers,
            newMarkersMerged: Selection<EnhancedScatterChartDataPoint> = markersChanged.markersMerged;

        newMarkers
            .exit()
            .remove();

        this.keyArray = scatterData.map((dataPoint: EnhancedScatterChartDataPoint) => {
            return (<ISelectionId>dataPoint.identity).getKey();
        });

        return newMarkersMerged;
    }

    public static getBubbleOpacity(d: EnhancedScatterChartDataPoint, hasSelection: boolean): number {
        if (hasSelection && !d.selected) {
            return EnhancedScatterChart.DimmedBubbleOpacity;
        }

        return EnhancedScatterChart.DefaultBubbleOpacity;
    }

    public calculateAxes(
        categoryAxisSettings: ScatterChartAxisCardSettings,
        valueAxisSettings: ScatterChartAxisCardSettings,
        textProperties: TextProperties,
        scrollbarVisible: boolean = true
    ): IAxisProperties[] {
        const visualOptions: CalculateScaleAndDomainOptions = {
            viewport: this.viewport,
            margin: this.margin,
            forcedXDomain: [
                categoryAxisSettings.start.value,
                categoryAxisSettings.end.value,
            ],
            forceMerge: false,
            showCategoryAxisLabel: false,
            showValueAxisLabel: true,
            categoryAxisScaleType: null,
            valueAxisScaleType: null,
            valueAxisDisplayUnits: +valueAxisSettings.labelDisplayUnits.value,
            categoryAxisDisplayUnits: +categoryAxisSettings.labelDisplayUnits.value,
            trimOrdinalDataOnOverflow: false
        };

        visualOptions.forcedYDomain = axis.applyCustomizedDomain(
            [
                valueAxisSettings.start.value,
                valueAxisSettings.end.value
            ],
            visualOptions.forcedYDomain
        );

        visualOptions.showCategoryAxisLabel = categoryAxisSettings.showAxisTitle.value;

        const width: number = this.viewport.width - (this.margin.left + this.margin.right);

        const axes: IAxisProperties[] = this.calculateAxesProperties(visualOptions);

        axes[0].willLabelsFit = axis.LabelLayoutStrategy.willLabelsFit(
            axes[0],
            width,
            measureSvgTextWidth,
            textProperties);

        // If labels do not fit and we are not scrolling, try word breaking
        axes[0].willLabelsWordBreak = (!axes[0].willLabelsFit && !scrollbarVisible)
            && axis.LabelLayoutStrategy.willLabelsWordBreak(
                axes[0],
                this.margin,
                width,
                measureSvgTextWidth,
                estimateSvgTextHeight,
                getTailoredTextOrDefault,
                textProperties
            );

        return axes;
    }

    public calculateAxesProperties(options: CalculateScaleAndDomainOptions): IAxisProperties[] {
        const data: EnhancedScatterChartData = this.data,
            dataPoints: EnhancedScatterChartDataPoint[] = data.dataPoints;

        this.margin = options.margin;
        this.viewport = options.viewport;

        let minY: number = EnhancedScatterChart.MinAxisValue,
            maxY: number = EnhancedScatterChart.MaxAxisValue,
            minX: number = EnhancedScatterChart.MinAxisValue,
            maxX: number = EnhancedScatterChart.MaxAxisValue;

        if (dataPoints.length > 0) {
            minY = d3Min<EnhancedScatterChartDataPoint, number>(dataPoints, dataPoint => dataPoint.y);
            maxY = d3Max<EnhancedScatterChartDataPoint, number>(dataPoints, dataPoint => dataPoint.y);
            minX = d3Min<EnhancedScatterChartDataPoint, number>(dataPoints, dataPoint => dataPoint.x);
            maxX = d3Max<EnhancedScatterChartDataPoint, number>(dataPoints, dataPoint => dataPoint.x);
        }

        this.setAxesStartEndValues(minX, maxX, minY, maxY);

        const xDomain: number[] = [minX, maxX];

        const combinedXDomain: number[] = axis.combineDomain(
            this.optimizeTranslateValues(options.forcedXDomain),
            xDomain
        );

        const xAxisFormatString: string = valueFormatter.getFormatStringByColumn(data.xCol);

        this.xAxisProperties = axis.createAxis({
            pixelSpan: this.viewportIn.width,
            dataDomain: combinedXDomain,
            metaDataColumn: data.xCol,
            formatString: xAxisFormatString,
            outerPadding: EnhancedScatterChart.OuterPadding,
            isScalar: true,
            isVertical: false,
            getValueFn: (index, dataType) => dataType.dateTime ? EnhancedScatterChart.displayTimestamp(index) : index,
            forcedTickCount: options.forcedTickCount,
            useTickIntervalForDisplayUnits: true,
            isCategoryAxis: true, // scatter doesn"t have a categorical axis, but this is needed for the pane to react correctly to the x-axis toggle one/off
            scaleType: options.categoryAxisScaleType,
            axisDisplayUnits: options.categoryAxisDisplayUnits
        });

        this.xAxisProperties.axis
            .tickSize(-this.viewportIn.height)
            .tickSizeOuter(EnhancedScatterChart.OuterPadding);

        this.xAxisProperties.axisLabel = this.data.axesLabels.x;

        const combinedYDomain: number[] = axis.combineDomain(
            this.optimizeTranslateValues(options.forcedYDomain),
            [minY, maxY]
        );

        const yAxisFormatString: string = valueFormatter.getFormatStringByColumn(data.yCol);

        this.yAxisProperties = axis.createAxis({
            pixelSpan: this.viewportIn.height,
            dataDomain: combinedYDomain,
            metaDataColumn: data.yCol,
            formatString: yAxisFormatString,
            outerPadding: EnhancedScatterChart.OuterPadding,
            isScalar: true,
            isVertical: true,
            getValueFn: (index, dataType) => dataType.dateTime ? EnhancedScatterChart.displayTimestamp(index) : index,
            forcedTickCount: options.forcedTickCount,
            useTickIntervalForDisplayUnits: true,
            isCategoryAxis: false,
            scaleType: options.valueAxisScaleType,
            axisDisplayUnits: options.valueAxisDisplayUnits,
        });

        this.yAxisProperties.axisLabel = this.data.axesLabels.y;

        return [
            this.xAxisProperties,
            this.yAxisProperties
        ];
    }

    /**
     * Public for testability.
     */
    public optimizeTranslateValues(values: number[]): number[] {
        if (values && values.map) {
            return values.map((value: number) => {
                return this.optimizeTranslateValue(value);
            });
        }

        return values;
    }

    /**
     * Public for testability.
     */
    public optimizeTranslateValue(value: number): number {
        if (value) {
            const numberSign: number = value >= EnhancedScatterChart.NumberSignZero
                ? EnhancedScatterChart.NumberSignPositive
                : -EnhancedScatterChart.NumberSignPositive;

            const absoluteValue: number = Math.abs(value);

            if (absoluteValue > EnhancedScatterChart.MaxTranslateValue) {
                return EnhancedScatterChart.MaxTranslateValue * numberSign;
            } else if (absoluteValue < EnhancedScatterChart.MinTranslateValue) {
                return EnhancedScatterChart.MinTranslateValue * numberSign;
            }
        }

        return value;
    }

    public setAxesStartEndValues(startX: number, endX: number, startY: number, endY: number) {
        const { enableCategoryAxisCardSettings, enableValueAxisCardSettings } = this.formattingSettings;
        
        enableCategoryAxisCardSettings.start.value ??= startX;
        enableCategoryAxisCardSettings.end.value ??= endX;
        enableValueAxisCardSettings.start.value ??= startY;
        enableValueAxisCardSettings.end.value ??= endY;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {

        this.filterSettingsCards();
        this.formattingSettings.setLocalizedOptions(this.localizationManager);

        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private filterSettingsCards() {

        const settings: EnhancedScatterChartSettingsModel = this.formattingSettings;

        settings.cards.forEach(element => {
            switch (element.name) {
/*                 case "dataPoint": {
                    if (this.data?.hasGradientRole || this.data?.useCustomColor) {
                        settings.enableDataPointCardSettings.visible = false;
                    }
                    settings.populateColorSelector(this.data.legendDataPoints, this.data.dataPoints);

                    break;
                } */
                case "fillPoint": {
                    if (this.data?.useShape) {
                        settings.enableFillPointCardSettings.visible = false;
                    }

                    break;
                }
                case "legend": {
                    if (!this.data || !this.data.hasDynamicSeries) {
                        settings.enableLegendCardSettings.visible = false;
                    }

                    break;
                }
                case "outline": {
                    if (this.data?.useShape) {
                        settings.enableOutlineCardSettings.visible = false;
                    }

                    break;
                }
            }
        });
    }
}