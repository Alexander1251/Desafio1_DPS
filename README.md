This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

import Pkg; Pkg.activate(".")
using CCNO
using ITensors
using ITensorMPS
using DelimitedFiles
using Plots
using LinearAlgebra
using Random

N_sites_eachflavor = 5
L = 1.0
Δx = L / N_sites_eachflavor
Eν = 50.0 * CCNO.MeV
n_ν = 4.891290848285061e32
k = 2π / L

perturbaciones = [1e-8, 1e-7, 1e-6, 1e-5]
threshold = 1e-6

mkpath("datafiles")
mkpath("plots")

tcrit_list = Float64[]
tvals_list = Vector{Vector{Float64}}()
rhos_list = Vector{Vector{Float64}}()

for θ in perturbaciones
    println("=== θ_nu = $(θ) ===")

    params = CCNO.Parameters(
        N_sites = 2 * N_sites_eachflavor,
        τ = 5E-13,
        ttotal = 9.0E-11,
        tolerance = 5E-1,
        m1 = 0.0,
        m2 = 0.0,
        maxdim = 50,
        cutoff = 1e-100,
        theta_nu = θ,
        shape_name = "triangular",
        geometric_name = "physical",
        Δx = Δx,
        L = L,
        Δp = Δx,
        periodic = true,
        checkpoint_every = 20,
        do_recover = false,
        recover_file = "",
        plotdir = joinpath(@__DIR__,"plots"),
        datadir = joinpath(@__DIR__,"datafiles"),
        chkptdir = joinpath(@__DIR__,"checkpoints"),
        save_plots_flag = false,
        α = 1e-6
    )

    x = CCNO.generate_x_array(N_sites_eachflavor, L)
    y = x; z = x
    p = hcat(
        CCNO.generate_px_array(params.N_sites, Eν, -Eν),
        CCNO.generate_py_array(params.N_sites),
        CCNO.generate_pz_array(params.N_sites)
    )

    s = siteinds("S=1/2", params.N_sites; conserve_qns=false)
    ψ = productMPS(s, n -> n ≤ params.N_sites/2 ? "Up" : "Dn")
    state = CCNO.SimulationState(
        ψ = ψ,
        s = s,
        p = p,
        energy_sign = ones(params.N_sites),
        N = CCNO.Neutrino_number(params, n_ν, n_ν),
        xyz = hcat(x,y,z)
    )

    isdir(params.chkptdir) && rm(params.chkptdir; recursive=true, force=true)
    isdir(params.datadir) && rm(params.datadir; recursive=true, force=true)

    CCNO.perturb(params, state, k, θ)
    CCNO.evolve(params, state)

    t_rho = readdlm(joinpath(params.datadir, "t_ρₑμ.dat"))
    t_vals = t_rho[:, 1]
    rho_mat = abs.(t_rho[:, 2:N_sites_eachflavor+1])
    rho_avg = mean(rho_mat, dims=2) |> vec

    idx = findfirst(rho_avg .> threshold)
    tcrit = idx === nothing ? NaN : t_vals[idx]
    println("  → t_crítico = $(tcrit) s")

    push!(tcrit_list, tcrit)
    push!(tvals_list, t_vals)
    push!(rhos_list, rho_avg)

    csv_file = joinpath("datafiles", "perturb_$(θ).csv")
    writedlm(csv_file, hcat(t_vals, rho_avg), ',')
    println("  Datos guardados en: ", csv_file, "\n")
end

plot(
    xlabel="t (s)", ylabel="⟨|ρₑμ|⟩",
    xscale=:linear, yscale=:log10,
    title="Evolución de ⟨|ρₑμ|⟩ para distintas θₙᵤ",
    legend=:topright, grid=true, linewidth=2
)
for (i, θ) in enumerate(perturbaciones)
    plot!(tvals_list[i], rhos_list[i], label="θₙᵤ=$(θ)")
end
savefig("plots/curvas_perturbaciones.png")
println("Gráfica de curvas guardada en: plots/curvas_perturbaciones.png")

plot(
    perturbaciones, tcrit_list;
    xscale=:log10,
    xlabel="θₙᵤ",
    ylabel="t_crítico (s)",
    title="Tiempo crítico vs amplitud de perturbación",
    marker=:circle, legend=false, grid=true
)
savefig("plots/tcrit_vs_theta_nu.png")
println("Gráfica t_crítico guardada en: plots/tcrit_vs_theta_nu.png")





