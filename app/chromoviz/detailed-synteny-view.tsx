'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { SyntenyData, ChromosomeData } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RefreshCw, Info, Minimize2, Maximize2, Settings, Save, Lock, Unlock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { HoverTooltip, GENE_ANNOTATION_CONFIG as TOOLTIP_GENE_CONFIG } from "@/components/chromoviz/tooltip";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Add configuration types
interface SyntenyViewConfig {
  visual: {
    ribbonOpacity: number;
    blockOpacity: number;
    trackWidth: number;
    gapAngle: number;
    colors: {
      reference: string;
      query: string;
      forwardStrand: string;
      reverseStrand: string;
    };
  };
  annotations: {
    show: boolean;
    height: number;
    spacing: number;
    colors: typeof TOOLTIP_GENE_CONFIG.COLORS;
  };
  scale: {
    showTicks: boolean;
    tickCount: number;
    tickLength: number;
    showLabels: boolean;
  };
  interaction: {
    enableZoom: boolean;
    zoomExtent: [number, number];
    showTooltips: boolean;
  };
}

interface DetailedSyntenyViewProps {
  selectedBlock: SyntenyData;
  referenceData: ChromosomeData[];
  onBlockClick: (block: SyntenyData) => void;
  selectedSynteny: SyntenyData[];
  onToggleSelection: (block: SyntenyData) => void;
  isFullscreen?: boolean;
  onFullscreen?: (isFullscreen: boolean) => void;
  config?: Partial<SyntenyViewConfig>;
  onConfigChange?: (config: SyntenyViewConfig) => void;
}

const defaultConfig: SyntenyViewConfig = {
  visual: {
    ribbonOpacity: 0.6,
    blockOpacity: 0.8,
    trackWidth: 0.15,
    gapAngle: 0.1,
    colors: {
      reference: '#e6effd',
      query: '#f5ebff',
      forwardStrand: '#3b82f6',
      reverseStrand: '#ef4444',
    },
  },
  annotations: {
    show: true,
    height: 8,
    spacing: 2,
    colors: TOOLTIP_GENE_CONFIG.COLORS,
  },
  scale: {
    showTicks: true,
    tickCount: 10,
    tickLength: 5,
    showLabels: true,
  },
  interaction: {
    enableZoom: true,
    zoomExtent: [0.5, 5],
    showTooltips: true,
  },
};

export function DetailedSyntenyView({
  selectedBlock,
  referenceData,
  onBlockClick,
  selectedSynteny,
  onToggleSelection,
  isFullscreen = false,
  onFullscreen,
  config: userConfig,
  onConfigChange
}: DetailedSyntenyViewProps & {
  onConfigChange?: (config: SyntenyViewConfig) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBlock, setHoveredBlock] = useState<SyntenyData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredChromosome, setHoveredChromosome] = useState<{
    size: number;
    isRef: boolean;
    position?: number;
    gene?: any;
  } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<SyntenyViewConfig>({ ...defaultConfig, ...userConfig });
  const [isGraphFixed, setIsGraphFixed] = useState(false);
  const [viewBoxDimensions, setViewBoxDimensions] = useState({ width: 1400, height: 1400 });

  // Add fullscreen handling
  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        onFullscreen?.(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        onFullscreen?.(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  // Add fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onFullscreen?.(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onFullscreen]);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const currentZoom = d3.zoomTransform(svg.node() as any);
    svg.transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        currentZoom.scale(currentZoom.k * 1.2)
      );
    setZoom(currentZoom.k * 1.2);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const currentZoom = d3.zoomTransform(svg.node() as any);
    svg.transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        currentZoom.scale(currentZoom.k * 0.8)
      );
    setZoom(currentZoom.k * 0.8);
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      );
    setZoom(1);
  };

  const handleSaveAsSVG = () => {
    if (!svgRef.current) return;

    // Get SVG content
    const svgElement = svgRef.current;
    const svgContent = new XMLSerializer().serializeToString(svgElement);
    
    // Add XML declaration and SVG namespace
    const svgBlob = new Blob([
      '<?xml version="1.0" standalone="no"?>\r\n',
      svgContent
    ], { type: 'image/svg+xml;charset=utf-8' });
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(svgBlob);
    downloadLink.download = `chromoviz-synteny-${new Date().toISOString().split('T')[0]}.svg`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up
    URL.revokeObjectURL(downloadLink.href);
  };

  const refChromosome = selectedBlock ? referenceData.find(d => 
    d.species_name === selectedBlock.ref_species && d.chr_id === selectedBlock.ref_chr
  ) : null;

  const queryChromosome = selectedBlock ? referenceData.find(d => 
    d.species_name === selectedBlock.query_name && d.chr_id === selectedBlock.query_chr
  ) : null;

  // Add resize observer to update viewBox
  useEffect(() => {
    if (!containerRef.current) return;

    const updateViewBox = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      setViewBoxDimensions({
        width: rect.width,
        height: rect.height
      });
    };

    // Initial update
    updateViewBox();

    // Create resize observer
    const resizeObserver = new ResizeObserver(updateViewBox);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update SVG rendering code to use new dimensions
  useEffect(() => {
    if (!svgRef.current || !selectedBlock) return;

    const zoomBehavior = d3.zoom()
      .scaleExtent(config.interaction.zoomExtent)
      .on('zoom', (event) => {
        if (!svgRef.current) return;
        const g = d3.select(svgRef.current).select('g');
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Only apply zoom behavior if graph is not fixed
    if (!isGraphFixed) {
      svg.call(zoomBehavior as any);
    }

    // Helper function to format base pairs
    const formatBase = (value: number) => {
      if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}Mb`;
      } else if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}kb`;
      }
      return `${value}bp`;
    };

    const width = viewBoxDimensions.width;
    const height = viewBoxDimensions.height;
    const margin = { 
      top: height * 0.07,    // 7% of height
      right: width * 0.07,   // 7% of width
      bottom: height * 0.07, // 7% of height
      left: width * 0.07     // 7% of width
    };
    
    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

    // Create layers
    const ribbonLayer = g.append('g').attr('class', 'ribbon-layer');
    const chromosomeLayer = g.append('g').attr('class', 'chromosome-layer');
    const syntenyLayer = g.append('g').attr('class', 'synteny-layer');
    const labelLayer = g.append('g').attr('class', 'label-layer');

    // Dimensions
    const radius = Math.min(width, height) * 0.3;
    const innerRadius = radius * 0.8;
    const trackWidth = radius * config.visual.trackWidth;
    const gapAngle = Math.PI * config.visual.gapAngle;

    if (!refChromosome || !queryChromosome) return;

    // Calculate the relative sizes and adjust track width
    const maxChrSize = Math.max(refChromosome.chr_size_bp, queryChromosome.chr_size_bp);
    const refRelativeSize = refChromosome.chr_size_bp / maxChrSize;
    const queryRelativeSize = queryChromosome.chr_size_bp / maxChrSize;

    // Adjust arc angles based on relative sizes
    const refArcLength = Math.PI - (2 * gapAngle);
    const queryArcLength = Math.PI - (2 * gapAngle);

    // Create scales with adjusted ranges
    const refScale = d3.scaleLinear()
      .domain([0, refChromosome.chr_size_bp])
      .range([gapAngle, gapAngle + (refArcLength * refRelativeSize)]);

    const queryScale = d3.scaleLinear()
      .domain([0, queryChromosome.chr_size_bp])
      .range([Math.PI + gapAngle, Math.PI + gapAngle + (queryArcLength * queryRelativeSize)]);

    // Update arc definitions with new angles
    const refArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(innerRadius + trackWidth)
      .startAngle(gapAngle)
      .endAngle(gapAngle + (refArcLength * refRelativeSize));

    const queryArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(innerRadius + trackWidth)
      .startAngle(Math.PI + gapAngle)
      .endAngle(Math.PI + gapAngle + (queryArcLength * queryRelativeSize));

    chromosomeLayer.append('path')
      .attr('d', refArc({} as any) as string)
      .attr('fill', config.visual.colors.reference)
      .attr('stroke', '#d1d5db')
      .attr('cursor', 'pointer')
      .on('mousemove', (event) => {
        const [x, y] = d3.pointer(event);
        const angle = Math.atan2(y, x) + Math.PI / 2;
        const position = refScale.invert(angle);
        setHoveredChromosome({
          size: refChromosome.chr_size_bp,
          isRef: true,
          position: Math.round(position)
        });
        setHoveredBlock(selectedBlock);
      })
      .on('mouseleave', () => {
        setHoveredChromosome(null);
        setHoveredBlock(null);
      });

    // Add reference label
    const refEndAngle = gapAngle + (refArcLength * refRelativeSize);
    const refLabelX = (innerRadius + trackWidth + 65) * Math.cos(refEndAngle - Math.PI/2);
    const refLabelY = (innerRadius + trackWidth + 65) * Math.sin(refEndAngle - Math.PI/2);
    
    chromosomeLayer.append('text')
      .attr('class', 'chromosome-label')
      .attr('transform', `translate(${refLabelX}, ${refLabelY})`)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-size', '14px')
      .text(`Reference: ${refChromosome.species_name} ${refChromosome.chr_id}`);

    chromosomeLayer.append('path')
      .attr('d', queryArc({} as any) as string)
      .attr('fill', config.visual.colors.query)
      .attr('stroke', '#d1d5db')
      .attr('cursor', 'pointer')
      .on('mousemove', (event) => {
        const [x, y] = d3.pointer(event);
        const angle = Math.atan2(y, x) + Math.PI / 2;
        const position = queryScale.invert(angle);
        setHoveredChromosome({
          size: queryChromosome.chr_size_bp,
          isRef: false,
          position: Math.round(position)
        });
        setHoveredBlock(selectedBlock);
      })
      .on('mouseleave', () => {
        setHoveredChromosome(null);
        setHoveredBlock(null);
      });

    // Add query label
    const queryStartAngle = Math.PI + gapAngle;
    const queryLabelX = (innerRadius + trackWidth + 45) * Math.cos(queryStartAngle - Math.PI/2);
    const queryLabelY = (innerRadius + trackWidth + 45) * Math.sin(queryStartAngle - Math.PI/2);
    
    chromosomeLayer.append('text')
      .attr('class', 'chromosome-label')
      .attr('transform', `translate(${queryLabelX}, ${queryLabelY})`)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-size', '14px')
      .text(`Query: ${queryChromosome.species_name} ${queryChromosome.chr_id}`);

    // Add gene annotations for reference chromosome
    if (refChromosome && refChromosome.annotations && config.annotations.show) {
      const annotationGroup = chromosomeLayer.append('g')
        .attr('class', 'ref-annotations');

      refChromosome.annotations.forEach((gene) => {
        const startAngle = refScale(gene.start);
        const endAngle = refScale(gene.end);
        
        // Create an arc for each gene annotation
        const annotationArc = d3.arc()
          .innerRadius(innerRadius + trackWidth)
          .outerRadius(innerRadius + trackWidth + config.annotations.height)
          .startAngle(startAngle)
          .endAngle(endAngle);

        annotationGroup.append('path')
          .attr('d', annotationArc({} as any) as string)
          .attr('fill', config.annotations.colors[gene.class as keyof typeof config.annotations.colors] || config.annotations.colors.default)
          .attr('cursor', 'pointer')
          .on('mouseover', (event) => {
            const [x, y] = d3.pointer(event);
            setHoveredChromosome({
              size: refChromosome.chr_size_bp,
              isRef: true,
              position: Math.round(refScale.invert(Math.atan2(y, x) + Math.PI / 2)),
              gene: gene
            });
          })
          .on('mouseleave', () => {
            setHoveredChromosome(null);
          });
      });
    }

    // Draw ribbon
    const ribbon = d3.ribbon()
      .radius(innerRadius)
      .padAngle(0.02)
      .source((d) => ({
        startAngle: refScale(selectedBlock.ref_start),
        endAngle: refScale(selectedBlock.ref_end),
        radius: innerRadius
      }))
      .target((d) => ({
        startAngle: queryScale(selectedBlock.query_start),
        endAngle: queryScale(selectedBlock.query_end),
        radius: innerRadius
      }));

    // Add ribbon with gradient
    const gradientId = `ribbon-gradient-${selectedBlock.query_strand}`;
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('gradientUnits', 'userSpaceOnUse');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', config.visual.colors.forwardStrand)
      .attr('stop-opacity', 0.2);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', config.visual.colors.forwardStrand)
      .attr('stop-opacity', 0.6);

    // Create a properly typed data object for the ribbon
    const ribbonData = {
      source: {
        startAngle: refScale(selectedBlock.ref_start),
        endAngle: refScale(selectedBlock.ref_end),
        radius: innerRadius
      },
      target: {
        startAngle: queryScale(selectedBlock.query_start),
        endAngle: queryScale(selectedBlock.query_end),
        radius: innerRadius
      }
    };

    // Update the ribbon path hover interactions
    ribbonLayer.append('path')
      .datum(ribbonData)
      .attr('d', ribbon as any)
      .attr('fill', `url(#${gradientId})`)
      .attr('stroke', config.visual.colors.forwardStrand)
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', 1)
      .attr('cursor', 'pointer')
      .attr('class', 'synteny-block')
      .on('mouseenter', (event) => {
        event.stopPropagation();
        setHoveredBlock(selectedBlock);
        setHoveredChromosome(null);
      })
      .on('mouseleave', (event) => {
        event.stopPropagation();
        setHoveredBlock(null);
      });

    // Draw synteny blocks
    const blockColor = selectedBlock.query_strand === '+' ? config.visual.colors.forwardStrand : config.visual.colors.reverseStrand;
    
    // Reference block
    syntenyLayer.append('path')
      .attr('d', refArc
        .startAngle(refScale(selectedBlock.ref_start))
        .endAngle(refScale(selectedBlock.ref_end))({} as any) as string)
      .attr('fill', blockColor)
      .attr('opacity', config.visual.blockOpacity)
      .attr('cursor', 'pointer')
      .attr('class', 'synteny-block')
      .on('mouseenter', (event) => {
        event.stopPropagation();
        setHoveredBlock(selectedBlock);
        setHoveredChromosome(null);
      })
      .on('mouseleave', (event) => {
        event.stopPropagation();
        setHoveredBlock(null);
      });

    // Query block
    syntenyLayer.append('path')
      .attr('d', queryArc
        .startAngle(queryScale(selectedBlock.query_start))
        .endAngle(queryScale(selectedBlock.query_end))({} as any) as string)
      .attr('fill', blockColor)
      .attr('opacity', config.visual.blockOpacity)
      .attr('cursor', 'pointer')
      .attr('class', 'synteny-block')
      .on('mouseenter', (event) => {
        event.stopPropagation();
        setHoveredBlock(selectedBlock);
        setHoveredChromosome(null);
      })
      .on('mouseleave', (event) => {
        event.stopPropagation();
        setHoveredBlock(null);
      });

    // Add circular scale
    const addCircularScale = (isRef: boolean) => {
      const scale = isRef ? refScale : queryScale;
      const baseRadius = innerRadius + trackWidth;
      const tickCount = config.scale.tickCount;
      const chromosomeSize = isRef ? refChromosome.chr_size_bp : queryChromosome.chr_size_bp;
      
      const ticks = d3.range(0, chromosomeSize, chromosomeSize / tickCount);
      
      ticks.forEach(tick => {
        const angle = scale(tick);
        const x1 = baseRadius * Math.cos(angle - Math.PI / 2);
        const y1 = baseRadius * Math.sin(angle - Math.PI / 2);
        const x2 = (baseRadius + config.scale.tickLength) * Math.cos(angle - Math.PI / 2);
        const y2 = (baseRadius + config.scale.tickLength) * Math.sin(angle - Math.PI / 2);
        
        labelLayer.append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 1);
      });
    };

    // Replace addPositionTick function with new arc-based version
    const addPositionTick = (angle: number, position: number, isRef: boolean) => {
      const tickRadius = innerRadius + trackWidth;
      const tickLength = 40;
      const textOffset = 55;
      
      // Add extended tick line
      labelLayer.append('line')
        .attr('x1', tickRadius * Math.cos(angle - Math.PI / 2))
        .attr('y1', tickRadius * Math.sin(angle - Math.PI / 2))
        .attr('x2', (tickRadius + tickLength) * Math.cos(angle - Math.PI / 2))
        .attr('y2', (tickRadius + tickLength) * Math.sin(angle - Math.PI / 2))
        .attr('stroke', isRef ? '#3b82f6' : '#8b5cf6')  // blue for ref, purple for query
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');  // dashed line

      // Add position text
      const textX = (tickRadius + textOffset) * Math.cos(angle - Math.PI / 2);
      const textY = (tickRadius + textOffset) * Math.sin(angle - Math.PI / 2);
      const labelAngle = (angle * 180 / Math.PI - 90) % 360;
      const rotateAngle = labelAngle > 90 && labelAngle < 270 ? labelAngle + 180 : labelAngle;
      
      labelLayer.append('text')
        .attr('x', textX)
        .attr('y', textY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('transform', `rotate(${rotateAngle}, ${textX}, ${textY})`)
        .attr('font-size', '14px')
        .attr('font-weight', '500')
        .attr('fill', isRef ? '#3b82f6' : '#8b5cf6')
        .text(formatBase(position));
        
      // Add small circular marker at the position
      labelLayer.append('circle')
        .attr('cx', tickRadius * Math.cos(angle - Math.PI / 2))
        .attr('cy', tickRadius * Math.sin(angle - Math.PI / 2))
        .attr('r', 3)
        .attr('fill', isRef ? '#3b82f6' : '#8b5cf6');
    };

    // Add circular scales
    addCircularScale(true);   // Reference
    addCircularScale(false);  // Query

    // Add position ticks with badges
    addPositionTick(refScale(selectedBlock.ref_start), selectedBlock.ref_start, true);
    addPositionTick(refScale(selectedBlock.ref_end), selectedBlock.ref_end, true);
    addPositionTick(queryScale(selectedBlock.query_start), selectedBlock.query_start, false);
    addPositionTick(queryScale(selectedBlock.query_end), selectedBlock.query_end, false);

    // Replace the size indicator text with a Glass Neumorphic Badge
    const sizeIndicator = g.append('g')
      .attr('transform', 'translate(0,0)');

    // Add background pill
    sizeIndicator.append('rect')
      .attr('x', -50)
      .attr('y', -15)
      .attr('width', 100)
      .attr('height', 30)
      .attr('rx', 15)
      .attr('fill', 'rgba(255,255,255,0.4)')
      .attr('stroke', 'rgba(255,255,255,0.5)')
      .attr('stroke-width', 1);

    // Add text
    sizeIndicator.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '16px')
      .attr('fill', 'currentColor')
      .text(`${((selectedBlock.ref_end - selectedBlock.ref_start) / 1_000_000).toFixed(1)}Mb`);

    // Cleanup
    return () => {
      svg.on('.zoom', null); // Remove zoom behavior on cleanup
    };
  }, [selectedBlock, referenceData, onBlockClick, config, isGraphFixed, viewBoxDimensions]);

  const handleConfigChange = (newConfig: Partial<SyntenyViewConfig>) => {
    const updatedConfig = {
      ...config,
      ...newConfig,
      visual: { ...config.visual, ...newConfig.visual },
      annotations: { ...config.annotations, ...newConfig.annotations },
      scale: { ...config.scale, ...newConfig.scale },
      interaction: { ...config.interaction, ...newConfig.interaction },
    };
    setConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full flex flex-col",
        isFullscreen && "fixed inset-0 bg-background/95 backdrop-blur-sm z-50"
      )}
    >
      {/* Controls Header - Updated to take full width in fullscreen */}
      <div className={cn(
        "flex items-center justify-between p-2 border-b",
        isFullscreen && "w-full"
      )}>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInfo(!showInfo)}
            className="h-8 px-3 gap-2"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="h-8 px-3 gap-2"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Badge variant="secondary">
            {Math.round(zoom * 100)}%
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isGraphFixed ? "default" : "outline"}
            size="sm"
            onClick={() => setIsGraphFixed(!isGraphFixed)}
            className="h-8 px-3 gap-2"
          >
            {isGraphFixed ? (
              <>
                <Lock className="h-4 w-4" />
                
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" />
                
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAsSVG}
            className="h-8 px-3 gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
            disabled={isGraphFixed}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 w-8 p-0"
            disabled={isGraphFixed}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
            disabled={isGraphFixed}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreen}
            className="h-8 w-8 p-0"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Area - Updated to take full width */}
      <div className={cn(
        "relative flex-1 min-h-0",
        isFullscreen && "w-full h-full flex items-center justify-center"
      )}>
        {/* Info Card - Left side */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "absolute top-2 left-2 z-20",
                isFullscreen && "fixed top-[80px]"
              )}
            >
              <Card className="w-[300px] bg-white/40 dark:bg-gray-950/40 backdrop-blur-md border-white/50 dark:border-gray-800/50 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_0_8px_rgba(0,0,0,0.4)]">
                <CardContent className="p-4 space-y-4">
                  {/* Reference Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className="bg-blue-50/50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 border-blue-200/50 dark:border-blue-800/50"
                      >
                        Reference
                      </Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedBlock?.ref_species}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant="secondary" className="bg-blue-100/50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100">
                        Chr: {selectedBlock?.ref_chr}
                      </Badge>
                      <Badge variant="outline" className="bg-white/40 dark:bg-gray-950/40">
                        {((refChromosome?.chr_size_bp ?? 0) / 1_000_000).toFixed(1)}Mb
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline" className="flex-1">
                        Start: {(selectedBlock?.ref_start! / 1_000_000).toFixed(1)}Mb
                      </Badge>
                      <Badge variant="outline" className="flex-1">
                        End: {(selectedBlock?.ref_end! / 1_000_000).toFixed(1)}Mb
                      </Badge>
                    </div>
                  </div>

                  <Separator className="bg-gray-200 dark:bg-gray-800" />

                  {/* Query Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className="bg-purple-50/50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 border-purple-200/50 dark:border-purple-800/50"
                      >
                        Query
                      </Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedBlock?.query_name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant="secondary" className="bg-purple-100/50 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100">
                        Chr: {selectedBlock?.query_chr}
                      </Badge>
                      <Badge variant="outline" className="bg-white/40 dark:bg-gray-950/40">
                        {((queryChromosome?.chr_size_bp ?? 0) / 1_000_000).toFixed(1)}Mb
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline" className="flex-1">
                        Start: {(selectedBlock?.query_start! / 1_000_000).toFixed(1)}Mb
                      </Badge>
                      <Badge variant="outline" className="flex-1">
                        End: {(selectedBlock?.query_end! / 1_000_000).toFixed(1)}Mb
                      </Badge>
                    </div>
                    <Badge 
                      variant={selectedBlock?.query_strand === '+' ? 'default' : 'destructive'}
                      className="w-full justify-center"
                    >
                      {selectedBlock?.query_strand === '+' ? 'Forward Strand' : 'Reverse Strand'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Config Card - Updated to left side */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "absolute top-2 left-2 z-20",
                isFullscreen && "fixed top-[80px]"
              )}
            >
              <Card className="w-[400px] bg-white/40 dark:bg-gray-950/40 backdrop-blur-md border-white/50 dark:border-gray-800/50 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_0_8px_rgba(0,0,0,0.4)]">
                <CardContent className="p-4 space-y-4">
                  {/* Visual Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className="bg-green-50/50 text-green-900 dark:bg-green-900/20 dark:text-green-100 border-green-200/50 dark:border-green-800/50"
                      >
                        Visual
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Ribbon Opacity</Label>
                        <Slider
                          value={[config.visual.ribbonOpacity * 100]}
                          onValueChange={([value]) => 
                            handleConfigChange({ 
                              ...config,
                              visual: {
                                ...config.visual,
                                ribbonOpacity: value / 100 
                              }
                            })
                          }
                          max={100}
                          step={1}
                          className="h-4"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Block Opacity</Label>
                        <Slider
                          value={[config.visual.blockOpacity * 100]}
                          onValueChange={([value]) => 
                            handleConfigChange({ 
                              ...config,
                              visual: {
                                ...config.visual,
                                blockOpacity: value / 100 
                              }
                            })
                          }
                          max={100}
                          step={1}
                          className="h-4"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Track Width</Label>
                        <Slider
                          value={[config.visual.trackWidth * 100]}
                          onValueChange={([value]) => 
                            handleConfigChange({ 
                              visual: { ...config.visual, trackWidth: value / 100 } 
                            })
                          }
                          max={50}
                          step={1}
                          className="h-4"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Gap Angle</Label>
                        <Slider
                          value={[config.visual.gapAngle * 100]}
                          onValueChange={([value]) => 
                            handleConfigChange({ 
                              visual: { ...config.visual, gapAngle: value / 100 } 
                            })
                          }
                          max={50}
                          step={1}
                          className="h-4"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs">Reference</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-6"
                              style={{ backgroundColor: config.visual.colors.reference }}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2">
                            <Input
                              type="color"
                              value={config.visual.colors.reference}
                              onChange={(e) => 
                                handleConfigChange({
                                  visual: { 
                                    ...config.visual, // Spread the existing visual configuration
                                    colors: { 
                                      ...config.visual.colors, // Spread the existing colors
                                      reference: e.target.value 
                                    } 
                                  }
                                })
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs">Query</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-6"
                              style={{ backgroundColor: config.visual.colors.query }}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2">
                            <Input
                              type="color"
                              value={config.visual.colors.query}
                              onChange={(e) => 
                                handleConfigChange({
                                  visual: { 
                                    ...config.visual, // Spread the existing visual configuration
                                    colors: { 
                                      ...config.visual.colors, // Spread the existing colors
                                      query: e.target.value 
                                    } 
                                  }
                                })
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-200 dark:bg-gray-800 my-2" />

                  {/* Annotations Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className="bg-purple-50/50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 border-purple-200/50 dark:border-purple-800/50"
                      >
                        Annotations
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.annotations.show}
                          onCheckedChange={(checked) =>
                            handleConfigChange({
                              annotations: { 
                                ...config.annotations, 
                                show: checked 
                              }
                            })
                          }
                          className="scale-75"
                        />
                        <Label className="text-xs">Show</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Height</Label>
                        <Slider
                          value={[config.annotations.height]}
                          onValueChange={([value]) =>
                            handleConfigChange({
                              annotations: { 
                                ...config.annotations, 
                                height: value 
                              }
                            })
                          }
                          max={20}
                          step={1}
                          className="h-4"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Spacing</Label>
                        <Slider
                          value={[config.annotations.spacing]}
                          onValueChange={([value]) =>
                            handleConfigChange({
                              annotations: { 
                                ...config.annotations, 
                                spacing: value 
                              }
                            })
                          }
                          max={10}
                          step={1}
                          className="h-4"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-200 dark:bg-gray-800 my-2" />

                  {/* Scale Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className="bg-blue-50/50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 border-blue-200/50 dark:border-blue-800/50"
                      >
                        Scale
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.scale.showTicks}
                          onCheckedChange={(checked) =>
                            handleConfigChange({
                              scale: { 
                                ...config.scale, 
                                showTicks: checked 
                              }
                            })
                          }
                          className="scale-75"
                        />
                        <Label className="text-xs">Show Ticks</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tick Count</Label>
                        <Slider
                          value={[config.scale.tickCount]}
                          onValueChange={([value]) =>
                            handleConfigChange({
                              scale: { 
                                ...config.scale, 
                                tickCount: value 
                              }
                            })
                          }
                          min={4}
                          max={20}
                          step={1}
                          className="h-4"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Tick Length</Label>
                        <Slider
                          value={[config.scale.tickLength]}
                          onValueChange={([value]) =>
                            handleConfigChange({
                              scale: { 
                                ...config.scale, 
                                tickLength: value 
                              }
                            })
                          }
                          max={20}
                          step={1}
                          className="h-4"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-200 dark:bg-gray-800 my-2" />

                  {/* Interaction Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className="bg-purple-50/50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100 border-purple-200/50 dark:border-purple-800/50"
                      >
                        Interaction
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.interaction.enableZoom}
                          onCheckedChange={(checked) =>
                            handleConfigChange({
                              interaction: { 
                                ...config.interaction, 
                                enableZoom: checked 
                              }
                            })
                          }
                          className="scale-75"
                        />
                        <Label className="text-xs">Enable Zoom</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Zoom Min</Label>
                        <Slider
                          value={[config.interaction.zoomExtent[0] * 100]}
                          onValueChange={([value]) =>
                            handleConfigChange({
                              interaction: { 
                                ...config.interaction, 
                                zoomExtent: [
                                  value / 100,
                                  config.interaction.zoomExtent[1]
                                ] 
                              }
                            })
                          }
                          min={10}
                          max={100}
                          step={1}
                          className="h-4"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Zoom Max</Label>
                        <Slider
                          value={[config.interaction.zoomExtent[1] * 100]}
                          onValueChange={([value]) =>
                            handleConfigChange({
                              interaction: { 
                                ...config.interaction, 
                                zoomExtent: [
                                  config.interaction.zoomExtent[0],
                                  value / 100
                                ] 
                              }
                            })
                          }
                          min={100}
                          max={1000}
                          step={10}
                          className="h-4"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.interaction.showTooltips}
                        onCheckedChange={(checked) =>
                          handleConfigChange({
                            interaction: { ...config.interaction, showTooltips: checked }
                          })
                        }
                        className="scale-75"
                      />
                      <Label className="text-xs">Show Tooltips</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SVG Container - Updated to take full width in fullscreen */}
        <div className={cn(
          "w-full h-full",
          isFullscreen ? "relative w-screen h-screen" : "relative aspect-square"
        )}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${viewBoxDimensions.width} ${viewBoxDimensions.height}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
          />
          
          <HoverTooltip 
            hoveredBlock={hoveredBlock}
            hoveredChromosome={hoveredChromosome}
            selectedBlock={selectedBlock}
          />
        </div>
      </div>
    </div>
  );
}