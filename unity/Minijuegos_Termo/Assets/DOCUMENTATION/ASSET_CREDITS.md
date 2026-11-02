# Asset credits and provenance

This project keeps imported art under `Assets/EXTERNAL_ASSETS/TermometroDeLaTierra/Art` and user-provided map artwork under `Assets/ART/MAPS`. The original `.meta` files were retained when project assets were brought into this destination.

## Third-party art

The following Kenney packs are included with their original `License.txt` files. Those notices identify the packs as Creative Commons Zero (CC0):

| Pack | Included source folder | License |
| --- | --- | --- |
| Tiny Town | `Art/Tilesets/KenneyTinyTown` | CC0 |
| Tiny City | `Art/Backgrounds/KenneyTinyCity` | CC0 |
| Tiny Battle | `Art/Characters/KenneyTinyBattle` | CC0 |
| Tiny Factory | `Art/Objects/KenneyTinyFactory` | CC0 |
| Tiny Farm | `Art/Objects/KenneyTinyFarm` | CC0 |
| Foliage Pack | `Art/ThirdParty/Kenney/Foliage` | CC0 |
| Platformer Pack: Industrial | `Art/ThirdParty/Kenney/Industrial` | CC0 |
| New Platformer Pack | `Art/ThirdParty/Kenney/NewPlatformer` | CC0 |

Creator and source: [Kenney](https://kenney.nl/assets). The pack-specific license files are kept beside the imported files. CC0 license text: [Creative Commons CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

## Typeface

`LiberationSans SDF` comes from Unity's TextMesh Pro Essentials resources. The included `Assets/TextMesh Pro/Fonts/LiberationSans - OFL.txt` identifies the font software as SIL Open Font License 1.1 and names Google Corporation and Red Hat, Inc. as copyright holders. The license file is included with the font.

## User-provided project artwork

The world map, route map, interface panels, buttons, locks, and world icons in `Assets/ART/MAPS` were copied from the user-provided `Minijuegos` project. No separate license notice accompanied those files in the inspected source folder; their provenance is recorded as user-provided project material, rather than as third-party or CC0 artwork.

The individually authored pixel sprites in `Assets/ART/OBJECTS/Originals` and `Assets/ART/BACKGROUNDS/CiudadDeBarrio.png` were copied from the user-provided `MINIminiJuegos` library. Its `Assets/DOCUMENTATION/ASSET_CREDITS.md` describes these sprites as original creations for Termómetro de la Tierra, and identifies the neighborhood city artwork as project-created. The sprite files and their Unity `.meta` import settings were copied together so each small sprite remains a full, correctly imported image instead of being sliced again.

The `Nido.png` sprite in `Assets/ART/SPRITES/FOREST` also comes from the same user-provided library. Its source credit record describes it as original project artwork.

## Visual references

Spiritfarer, Terra Nil, Mini Motorways, Little Big Workshop, Wilmot's Warehouse, and Stardew Valley are design references only. Their artwork, logos, screenshots, and other game assets are not included in this project. The visual study and how the design cues were adapted are recorded in [DESIGN_REFERENCE_NOTES.md](DESIGN_REFERENCE_NOTES.md).

## Audio

No third-party audio clips have been added. Audio references remain optional fields in the project scripts and can be assigned by the project owner.
